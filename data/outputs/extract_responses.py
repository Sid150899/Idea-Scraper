import json
import re

def extract_responses(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    scrape_ideas = []
    idea_detailing = None

    # --- Collect scrape agent ideas ---
    for entry in data:
        if "content" in entry and "parts" in entry["content"]:
            for part in entry["content"]["parts"]:
                if "functionResponse" in part and part["functionResponse"]["name"].startswith("scrape_"):
                    resp = part["functionResponse"]["response"]
                    if "result" in resp:
                        match = re.search(r"(\[.*\])", resp["result"], re.DOTALL)
                        if match:
                            try:
                                parsed_ideas = json.loads(match.group(1))
                                if isinstance(parsed_ideas, list):
                                    scrape_ideas.extend(parsed_ideas)
                            except json.JSONDecodeError:
                                print(f"⚠️ Could not parse scrape agent ideas from {part['functionResponse']['name']}")

                # --- Collect idea detailing agent response ---
                if "functionResponse" in part and part["functionResponse"]["name"] == "set_model_response":
                    resp = part["functionResponse"]["response"]
                    if isinstance(resp, dict) and "ideas" in resp:
                        idea_detailing = resp["ideas"]
                    elif isinstance(resp, list):
                        idea_detailing = resp
                    else:
                        idea_detailing = resp  # fallback

    if not scrape_ideas:
        raise ValueError("❌ Could not find any scrape agent responses in file.")
    if not idea_detailing:
        raise ValueError("❌ Could not find idea detailing agent response in file.")

    # --- Map titles -> urls for enrichment ---
    title_to_url = {idea.get("title"): idea.get("url") for idea in scrape_ideas if "title" in idea}

    # --- Enrich detailing with urls (if titles match) ---
    for det in idea_detailing:
        if isinstance(det, dict):
            title = det.get("title") or None  # sometimes detailing may not have title
            if not title:
                continue
            if title in title_to_url:
                det["url"] = title_to_url[title]

    return scrape_ideas, idea_detailing


if __name__ == "__main__":
    file_path = "pipeline_response.txt"
    scrape_ideas, idea_detailing = extract_responses(file_path)

    with open("scrape_agents_ideas.json", "w", encoding="utf-8") as f:
        json.dump(scrape_ideas, f, indent=2, ensure_ascii=False)

    with open("idea_detailing_agent_response.json", "w", encoding="utf-8") as f:
        json.dump(idea_detailing, f, indent=2, ensure_ascii=False)

    print("✅ Extracted successfully:")
    print(f" - scrape_agents_ideas.json ({len(scrape_ideas)} ideas total)")
    print(f" - idea_detailing_agent_response.json ({len(idea_detailing)} analyses, enriched with URLs)")
