const STORIES = [
  {
    id: "not-behind",
    number: "01",
    category: "Real Stories",
    title: "You're Not Behind. You're Becoming.",
    author: "Winnie",
    date: "August 10, 2026",
    cover: "cover-one",
    excerpt: "A reminder for anyone comparing their chapter one to someone else's chapter twenty.",
    body: `<p>There are seasons when it feels like everyone around you is moving forward while you are standing still. Someone got the job. Someone moved to the city. Someone got married. Someone seems to have life completely figured out.</p><p>And then you look at your own life and wonder, “What am I doing?”</p><p>But life is not a race with one finish line. Sometimes the season that looks slow from the outside is the season where you are building the strength, clarity and courage you will need later.</p><p>You are not behind. You are becoming.</p>`
  },

  {
    id: "suitcase",
    number: "02",
    category: "Fiction",
    title: "The Girl Who Kept a Suitcase by the Door",
    author: "The Winning Circle",
    date: "August 2026",
    cover: "cover-two",
    excerpt: "She had spent years preparing to leave. Then one ordinary Tuesday changed what home meant to her.",
    body: `<p>For three years, Mara kept a small blue suitcase beside the front door.</p><p>It contained two dresses, a pair of shoes, her passport and the letter she had written to herself on the night she decided she would leave.</p><p>Then, one Tuesday morning, the phone rang. It was not the call she had been waiting for. It was better.</p><p>Sometimes the life we are desperate to escape is not asking us to stay forever. It is simply asking us to notice what it taught us before we go.</p>`
  },

  {
    id: "7-15",
    number: "03",
    category: "Fiction",
    title: "At 7:15, the Phone Finally Rang",
    author: "The Winning Circle",
    date: "August 2026",
    cover: "cover-three",
    excerpt: "Sometimes the news you've been waiting for arrives on an ordinary morning.",
    body: `<p>At exactly 7:15 every morning, Daniel checked his phone.</p><p>For forty-two mornings, there had been nothing.</p><p>On the forty-third, while the kettle was still boiling, the phone rang.</p><p>He stared at the screen before answering. Not because he did not know who it was, but because he had spent so long imagining the moment that the real thing felt impossible.</p><p>“We would like to offer you the position.”</p><p>He smiled. Then he made the tea.</p>`
  },

  {
    id: "small-wins",
    number: "04",
    category: "Inspiration",
    title: "The Small Wins Count Too",
    author: "Winnie",
    date: "August 2026",
    cover: "cover-four",
    excerpt: "Not every victory deserves a celebration online. Some victories are simply surviving another difficult day.",
    body: `<p>We are taught to celebrate the big things: promotions, weddings, graduations, new homes and dramatic transformations.</p><p>But there are victories nobody photographs.</p><p>Getting out of bed when your mind wants you to stay there. Applying for one more job. Starting again. Saying no. Asking for help. Trying after failing.</p><p>Those wins count too.</p>`
  }
];

const CMS_REPO = "winniendolow/The-Winning-Circle";
const CMS_BRANCH = "main";

function parseFrontMatter(text) {
  const match = text.match(/^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);

  if (!match) {
    return {
      data: {},
      body: text
    };
  }

  const frontMatter = match[1];
  const body = match[2];

  const data = {};

  frontMatter.split("\n").forEach(line => {
    const colon = line.indexOf(":");

    if (colon === -1) return;

    const key = line.slice(0, colon).trim();
    let value = line.slice(colon + 1).trim();

    value = value.replace(/^["']|["']$/g, "");

    data[key] = value;
  });

  return { data, body };
}

function markdownToHTML(markdown) {
  let html = markdown
    .replace(/\r\n/g, "\n")
    .trim();

  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  html = html
    .split(/\n\s*\n/)
    .map(block => {
      block = block.trim();

      if (!block) return "";

      if (/^<h[1-3]>/.test(block)) return block;

      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return html;
}

async function loadCMSStories() {
  try {
    const apiURL =
      `https://api.github.com/repos/${CMS_REPO}/contents/content/stories?ref=${CMS_BRANCH}`;

    const response = await fetch(apiURL);

    if (!response.ok) {
      console.log("No CMS stories found yet.");
      return;
    }

    const files = await response.json();

    if (!Array.isArray(files)) return;

    const markdownFiles = files.filter(file =>
      file.name.endsWith(".md")
    );

    const cmsStories = await Promise.all(
      markdownFiles.map(async file => {
        const rawResponse = await fetch(file.download_url);
        const markdown = await rawResponse.text();

        const parsed = parseFrontMatter(markdown);
        const data = parsed.data;

        const id = file.name
          .replace(/\.md$/, "")
          .toLowerCase();

        return {
          id: id,
          number: "NEW",
          category: data.category || "Inspiration",
          title: data.title || "Untitled Story",
          author: data.author || "The Winning Circle",
          date: data.date
            ? new Date(data.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })
            : "",
          cover: data.cover
            ? data.cover.replace(/^\//, "")
            : "",
          excerpt: data.excerpt || "",
          body: markdownToHTML(parsed.body)
        };
      })
    );

    cmsStories.forEach(cmsStory => {
      const existingIndex = STORIES.findIndex(
        story => story.id === cmsStory.id
      );

      if (existingIndex >= 0) {
        STORIES[existingIndex] = cmsStory;
      } else {
        STORIES.push(cmsStory);
      }
    });

  } catch (error) {
    console.error("Could not load CMS stories:", error);
  }
}

const STORIES_READY = loadCMSStories();
