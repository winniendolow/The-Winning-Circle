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
    body: `<p>There are seasons when it feels like everyone around you is moving forward while you are standing still. Someone got the job. Someone moved to the city. Someone got married. Someone seems to have life completely figured out.</p>
    <p>And then you look at your own life and wonder, “What am I doing?”</p>
    <p>But life is not a race with one finish line. Sometimes the season that looks slow from the outside is the season where you are building the strength, clarity and courage you will need later.</p>
    <p>You are not behind. You are becoming.</p>`
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
    body: `<p>For three years, Mara kept a small blue suitcase beside the front door.</p>
    <p>It contained two dresses, a pair of shoes, her passport and the letter she had written to herself on the night she decided she would leave.</p>
    <p>Then, one Tuesday morning, the phone rang. It was not the call she had been waiting for. It was better.</p>
    <p>Sometimes the life we are desperate to escape is not asking us to stay forever. It is simply asking us to notice what it taught us before we go.</p>`
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
    body: `<p>At exactly 7:15 every morning, Daniel checked his phone.</p>
    <p>For forty-two mornings, there had been nothing.</p>
    <p>On the forty-third, while the kettle was still boiling, the phone rang.</p>
    <p>He stared at the screen before answering. Not because he did not know who it was, but because he had spent so long imagining the moment that the real thing felt impossible.</p>
    <p>“We would like to offer you the position.”</p>
    <p>He smiled. Then he made the tea.</p>`
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
    body: `<p>We are taught to celebrate the big things: promotions, weddings, graduations, new homes and dramatic transformations.</p>
    <p>But there are victories nobody photographs.</p>
    <p>Getting out of bed when your mind wants you to stay there. Applying for one more job. Starting again. Saying no. Asking for help. Trying after failing.</p>
    <p>Those wins count too.</p>`
  }
];


/*
  CMS SETTINGS
*/

const CMS_REPO = "winniendolow/The-Winning-Circle";
const CMS_BRANCH = "main";


/*
  Convert the CMS date into a readable date.
*/

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


/*
  Read the YAML information at the top of a CMS Markdown file.
*/

function parseFrontMatter(text) {

  const match = text.match(
    /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/m
  );

  if (!match) {
    return {
      data: {},
      body: text
    };
  }

  const frontMatter = match[1];
  const body = match[2];

  const data = {};

  frontMatter.split(/\r?\n/).forEach(line => {

    const separator = line.indexOf(":");

    if (separator === -1) return;

    const key = line
      .slice(0, separator)
      .trim();

    let value = line
      .slice(separator + 1)
      .trim();

    /*
      Remove surrounding quotes.
    */

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  });

  return {
    data,
    body
  };
}


/*
  Convert basic Markdown from Decap CMS into HTML.
*/

function markdownToHTML(markdown) {

  if (!markdown) return "";

  let text = markdown
    .replace(/\r\n/g, "\n")
    .trim();

  /*
    Headings
  */

  text = text.replace(
    /^### (.*)$/gm,
    "<h3>$1</h3>"
  );

  text = text.replace(
    /^## (.*)$/gm,
    "<h2>$1</h2>"
  );

  text = text.replace(
    /^# (.*)$/gm,
    "<h1>$1</h1>"
  );

  /*
    Bold and italic
  */

  text = text.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  text = text.replace(
    /\*(.*?)\*/g,
    "<em>$1</em>"
  );

  /*
    Convert paragraphs.
  */

  const blocks = text.split(/\n\s*\n/);

  return blocks
    .map(block => {

      block = block.trim();

      if (!block) return "";

      if (
        block.startsWith("<h1>") ||
        block.startsWith("<h2>") ||
        block.startsWith("<h3>")
      ) {
        return block;
      }

      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}


/*
  Load stories from the CMS/GitHub.
*/

async function loadCMSStories() {

  const apiURL =
    `https://api.github.com/repos/${CMS_REPO}/contents/content/stories?ref=${CMS_BRANCH}`;

  try {

    const response = await fetch(apiURL);

    if (!response.ok) {
      console.error(
        "Could not access CMS stories:",
        response.status
      );

      return;
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
      console.error("CMS stories response was not a list.");
      return;
    }

    const markdownFiles = files.filter(file =>
      file.type === "file" &&
      file.name.toLowerCase().endsWith(".md")
    );


    /*
      Load every Markdown story.
    */

    for (const file of markdownFiles) {

      try {

        const storyResponse =
          await fetch(file.download_url);

        if (!storyResponse.ok) {
          console.error(
            "Could not load story:",
            file.name
          );

          continue;
        }

        const markdown =
          await storyResponse.text();

        const parsed =
          parseFrontMatter(markdown);

        const data =
          parsed.data;


        /*
          Create the story ID from the filename.
        */

        const id =
          file.name
            .replace(/\.md$/i, "")
            .toLowerCase();


        /*
          Build the CMS story.
        */

        const cmsStory = {

          id: id,

          number: "NEW",

          category:
            data.category ||
            "Inspiration",

          title:
            data.title ||
            "Untitled Story",

          author:
            data.author ||
            "The Winning Circle",

          date:
            formatDate(data.date),

        cover:
  data.cover
    ? data.cover.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, "")
    : "",

          excerpt:
            data.excerpt ||
            "",

          body:
            markdownToHTML(parsed.body)

        };


        /*
          If a story with the same ID already exists,
          replace it.

          Otherwise add the new CMS story.
        */

        const existingIndex =
          STORIES.findIndex(
            story => story.id === cmsStory.id
          );

        if (existingIndex >= 0) {

          STORIES[existingIndex] =
            cmsStory;

        } else {

          STORIES.push(cmsStory);

        }

      } catch (storyError) {

        console.error(
          "Error loading story:",
          file.name,
          storyError
        );

      }
    }


    /*
      Sort CMS stories/new stories first,
      while keeping the original stories underneath.
    */

    const cmsStories =
      STORIES.filter(
        story =>
          story.number === "NEW"
      );

    const originalStories =
      STORIES.filter(
        story =>
          story.number !== "NEW"
      );

    STORIES.length = 0;

    STORIES.push(
      ...cmsStories,
      ...originalStories
    );


    console.log(
      "Stories successfully loaded:",
      STORIES
    );

  } catch (error) {

    console.error(
      "Unable to load CMS stories:",
      error
    );
  }
}


/*
  IMPORTANT:
  The website waits for the CMS stories to finish
  loading before displaying them.
*/

const STORIES_READY =
  loadCMSStories();
