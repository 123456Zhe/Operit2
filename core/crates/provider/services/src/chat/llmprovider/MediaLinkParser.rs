use std::sync::OnceLock;

use operit_util::ImagePoolManager::ImagePoolManager;
use operit_util::MediaPoolManager::MediaPoolManager;
use regex::Regex;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MediaLink {
    pub link_type: String,
    pub id: String,
    pub base64_data: String,
    pub mime_type: String,
    pub file_name: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ImageLink {
    pub link_type: String,
    pub id: String,
    pub base64_data: String,
    pub mime_type: String,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MediaLinkTag {
    pub link_type: String,
    pub id: String,
    pub file_name: Option<String>,
}

pub struct MediaLinkParser;

impl MediaLinkParser {
    /// Extracts registered image payloads referenced by media-link tags.
    pub fn extract_image_links(message: &str) -> Vec<ImageLink> {
        let mut links = Vec::new();
        for tag in Self::extract_media_link_tags(message)
            .into_iter()
            .filter(|tag| tag.link_type == "image")
        {
            let Some(image_data) = ImagePoolManager::get_image(&tag.id) else {
                continue;
            };
            links.push(ImageLink {
                link_type: tag.link_type,
                id: tag.id,
                base64_data: image_data.base64,
                mime_type: image_data.mime_type,
            });
        }
        links
    }

    /// Extracts image link ids in first-seen order.
    pub fn extract_image_link_ids(message: &str) -> Vec<String> {
        Self::extract_media_link_tags(message)
            .into_iter()
            .filter(|tag| tag.link_type == "image")
            .map(|tag| tag.id)
            .collect()
    }

    /// Removes image media-link tags while preserving other media-link tags.
    pub fn remove_image_links(message: &str) -> String {
        Self::replace_links(message, |tag| {
            if tag.link_type == "image" {
                String::new()
            } else {
                tag.raw.to_string()
            }
        })
    }

    /// Replaces image media-link tags while preserving other media-link tags.
    pub fn replace_image_links(message: &str, replacer: impl Fn(&str) -> String) -> String {
        Self::replace_links(message, |tag| {
            if tag.link_type == "image" {
                if tag.id == "error" {
                    String::new()
                } else {
                    replacer(&tag.id)
                }
            } else {
                tag.raw.to_string()
            }
        })
    }

    /// Reports whether the message contains at least one image media-link tag.
    pub fn has_image_links(message: &str) -> bool {
        parsed_link_tags(message)
            .iter()
            .any(|tag| tag.link_type == "image")
    }

    /// Extracts non-image media payload references from recognized link tags.
    pub fn extract_media_links(message: &str) -> Vec<MediaLink> {
        Self::extract_media_link_tags(message)
            .into_iter()
            .filter(|tag| {
                matches!(tag.link_type.as_str(), "audio" | "video" | "file")
            })
            .filter_map(|tag| {
                let media_data = MediaPoolManager::get_media(&tag.id)?;
                Some(MediaLink {
                    link_type: tag.link_type,
                    id: tag.id,
                    base64_data: media_data.base64,
                    mime_type: media_data.mime_type,
                    file_name: tag.file_name,
                })
            })
            .collect()
    }

    /// Extracts recognized media-link tags in first-seen order.
    pub fn extract_media_link_tags(message: &str) -> Vec<MediaLinkTag> {
        let mut tags = Vec::new();
        let mut seen = Vec::<(String, String)>::new();
        for tag in parsed_link_tags(message) {
            if tag.id == "error"
                || !matches!(tag.link_type.as_str(), "image" | "audio" | "video" | "file")
                || (tag.link_type == "file"
                    && tag
                        .file_name
                        .as_deref()
                        .map(str::trim)
                        .unwrap_or_default()
                        .is_empty())
                || seen
                    .iter()
                    .any(|(seen_type, seen_id)| seen_type == &tag.link_type && seen_id == &tag.id)
            {
                continue;
            }
            seen.push((tag.link_type.clone(), tag.id.clone()));
            tags.push(MediaLinkTag {
                link_type: tag.link_type,
                id: tag.id,
                file_name: tag.file_name,
            });
        }
        tags
    }

    /// Replaces non-image media-link tags using the supplied transformer.
    pub fn replace_media_links(message: &str, replacer: impl Fn(&str, &str) -> String) -> String {
        Self::replace_links(message, |tag| {
            if matches!(tag.link_type.as_str(), "audio" | "video" | "file") {
                if tag.id == "error" {
                    String::new()
                } else {
                    replacer(&tag.link_type, &tag.id)
                }
            } else {
                tag.raw.to_string()
            }
        })
    }

    /// Removes non-image media-link tags while preserving image media-link tags.
    pub fn remove_media_links(message: &str) -> String {
        Self::replace_media_links(message, |_, _| String::new())
    }

    /// Reports whether the message contains audio, video, or file media-link tags.
    pub fn has_media_links(message: &str) -> bool {
        parsed_link_tags(message)
            .iter()
            .any(|tag| matches!(tag.link_type.as_str(), "audio" | "video" | "file"))
    }

    /// Replaces recognized link tags in one pass.
    fn replace_links(message: &str, replacer: impl Fn(&ParsedLinkTag<'_>) -> String) -> String {
        let mut result = String::new();
        let mut cursor = 0;
        for tag in parsed_link_tags(message) {
            result.push_str(&message[cursor..tag.start]);
            result.push_str(&replacer(&tag));
            cursor = tag.end;
        }
        result.push_str(&message[cursor..]);
        result
    }
}

struct ParsedLinkTag<'a> {
    raw: &'a str,
    start: usize,
    end: usize,
    link_type: String,
    id: String,
    file_name: Option<String>,
}

/// Returns the compiled regex used to find link start tags.
fn link_start_tag_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        Regex::new(r#"(?is)<link\b[^>]*>"#).expect("media-link start tag regex must compile")
    })
}

/// Returns the compiled regex used to find link close tags.
fn link_close_tag_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        Regex::new(r#"(?is)</link\s*>"#).expect("media-link close tag regex must compile")
    })
}

/// Returns the compiled regex used to read link tag attributes.
fn link_attr_regex() -> &'static Regex {
    static REGEX: OnceLock<Regex> = OnceLock::new();
    REGEX.get_or_init(|| {
        Regex::new(r#"(?i)\b([A-Za-z_:-]+)\s*=\s*\\*["']?([^"'\\\s>]+)\\*["']?"#)
            .expect("media-link attribute regex must compile")
    })
}

/// Parses complete link tags and their relevant attributes.
fn parsed_link_tags(message: &str) -> Vec<ParsedLinkTag<'_>> {
    let mut tags = Vec::new();
    let mut cursor = 0;
    while let Some(open_tag) = link_start_tag_regex().find_at(message, cursor) {
        let open_text = open_tag.as_str();
        let raw_end = if is_self_closing_link_start(open_text) {
            open_tag.end()
        } else {
            let Some(close_tag) = link_close_tag_regex().find_at(message, open_tag.end()) else {
                cursor = open_tag.end();
                continue;
            };
            close_tag.end()
        };
        let raw = &message[open_tag.start()..raw_end];
        cursor = raw_end;
        let Some((link_type, id, file_name)) = parse_link_tag(open_text) else {
            continue;
        };
        tags.push(ParsedLinkTag {
            raw,
            start: open_tag.start(),
            end: raw_end,
            link_type,
            id,
            file_name,
        });
    }
    tags
}

/// Reports whether a link start tag is self-closing.
fn is_self_closing_link_start(tag_text: &str) -> bool {
    tag_text
        .trim_end()
        .trim_end_matches('>')
        .trim_end()
        .ends_with('/')
}

/// Parses the type and id attributes from one link tag.
fn parse_link_tag(tag_text: &str) -> Option<(String, String, Option<String>)> {
    let mut link_type = None;
    let mut id = None;
    let mut file_name = None;
    for capture in link_attr_regex().captures_iter(tag_text) {
        let name = capture.get(1)?.as_str().to_ascii_lowercase();
        let value = capture
            .get(2)?
            .as_str()
            .trim_end_matches('/')
            .trim_end_matches('\\')
            .to_string();
        match name.as_str() {
            "type" => link_type = Some(value.to_ascii_lowercase()),
            "id" => id = Some(value),
            "filename" => file_name = Some(unescape_xml_attribute(&value)),
            _ => {}
        }
    }
    Some((link_type?, id?, file_name.filter(|value| !value.trim().is_empty())))
}

/// Decodes XML entities used inside media-link attributes.
fn unescape_xml_attribute(value: &str) -> String {
    value
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&apos;", "'")
        .replace("&amp;", "&")
}

#[cfg(test)]
mod tests {
    use super::MediaLinkParser;
    use operit_util::ImagePoolManager::ImagePoolManager;
    use operit_util::MediaPoolManager::MediaPoolManager;

    /// Verifies image tags resolve through the image pool.
    #[test]
    fn extractImageLinksReadsRegisteredImageData() {
        ImagePoolManager::clear();
        let image_id = ImagePoolManager::add_image_bytes(
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\x0dIHDR\x00\x00\x00\x01\x00\x00\x00\x01",
            Some("image/png"),
            None,
        );
        let message = format!("before <link type=\"image\" id=\"{image_id}\"></link> after");

        let links = MediaLinkParser::extract_image_links(&message);

        assert_eq!(links.len(), 1);
        assert_eq!(links[0].id, image_id);
        assert_eq!(links[0].mime_type, "image/png");
        assert!(!links[0].base64_data.is_empty());
    }

    /// Verifies self-closing tags are parsed and only image tags are removed.
    #[test]
    fn selfClosingImageTagsAreRecognizedAndRemovedSelectively() {
        let message =
            "a <link type=\"image\" id=\"img1\"/> b <link type=\"audio\" id=\"aud1\"></link>";

        assert_eq!(
            MediaLinkParser::extract_image_link_ids(message),
            vec!["img1".to_string()]
        );
        assert_eq!(
            MediaLinkParser::remove_image_links(message),
            "a  b <link type=\"audio\" id=\"aud1\"></link>"
        );
    }

    /// Verifies file links preserve their decoded filename and encounter order.
    #[test]
    fn fileLinksPreserveDecodedFilename() {
        let message = concat!(
            "<link filename=\"report&amp;one.pdf\" id=\"f1\" type=\"file\">",
            "PDF</link><link type=\"audio\" id=\"a1\">Audio</link>"
        );

        let tags = MediaLinkParser::extract_media_link_tags(message);

        assert_eq!(tags.len(), 2);
        assert_eq!(tags[0].link_type, "file");
        assert_eq!(tags[0].id, "f1");
        assert_eq!(tags[0].file_name.as_deref(), Some("report&one.pdf"));
        assert_eq!(tags[1].link_type, "audio");
        assert_eq!(tags[1].file_name, None);
        assert_eq!(MediaLinkParser::remove_media_links(message), "");
    }

    /// Verifies error image tags are detected and removed without producing ids.
    #[test]
    fn errorImageTagsAreDetectedAndRemoved() {
        let message = "a <link type=\"image\" id=\"error\"></link> b";

        assert!(MediaLinkParser::has_image_links(message));
        assert!(MediaLinkParser::extract_image_link_ids(message).is_empty());
        assert_eq!(MediaLinkParser::remove_image_links(message), "a  b");
        assert_eq!(
            MediaLinkParser::replace_image_links(message, |_| "x".to_string()),
            "a  b"
        );
    }

    /// Verifies audio and video tags resolve through the media pool.
    #[test]
    fn extractMediaLinksReadsRegisteredMediaData() {
        let audio_id = MediaPoolManager::add_media_bytes(b"audio", "audio/mpeg");
        let video_id = MediaPoolManager::add_media_bytes(b"video", "video/mp4");
        let message = format!(
            "<link type=\"audio\" id=\"{audio_id}\"></link> <link type=\"video\" id=\"{video_id}\"/>"
        );

        let links = MediaLinkParser::extract_media_links(&message);

        assert_eq!(links.len(), 2);
        assert_eq!(links[0].id, audio_id);
        assert_eq!(links[0].mime_type, "audio/mpeg");
        assert_eq!(links[0].base64_data, "YXVkaW8=");
        assert_eq!(links[1].id, video_id);
        assert_eq!(links[1].mime_type, "video/mp4");
        assert_eq!(links[1].base64_data, "dmlkZW8=");
        MediaPoolManager::remove_media(&links[0].id);
        MediaPoolManager::remove_media(&links[1].id);
    }
}
