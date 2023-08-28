const fs = require("fs");
const puppeteer = require("puppeteer");

async function run() {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
    });
    const page = await browser.newPage();
    await page.goto("https://lolesports.com/schedule?leagues=lec");

    await page.waitForSelector(".EventDate");

    const response = await page.evaluate(() => {
      const holder = [];

      const eventDate = document.querySelectorAll(".EventDate, .EventMatch");

      let date = null;

      eventDate.forEach((e) => {
        if (e.classList.contains("EventDate")) {
          const dateText = e.textContent;
          if (dateText.includes("Yesterday")) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            date = {
              date: `${yesterday.toLocaleDateString("en-GB", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}`,
              matches: [],
            };
          } else if (dateText.includes("Tomorrow")) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            date = {
              date: `${tomorrow.toLocaleDateString("en-GB", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}`,
              matches: [],
            };
          } else if (dateText.includes("Today")) {
            const today = new Date();
            today.setDate(today.getDate());
            date = {
              date: `${today.toLocaleDateString("en-GB", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}`,
              matches: [],
            };
          } else {
            date = {
              date: dateText,
              matches: [],
            };
          }
          holder.push(date);
        } else if (date && !e.querySelector(".live")) {
          const eventMatch = e.querySelector(".EventMatch .teams");
          const matchClasses = eventMatch.classList;
          const hasWinner =
            matchClasses.contains("winner-team1") ||
            matchClasses.contains("winner-team2");
          const team1 =
            eventMatch.querySelector(".team.team1 h2 .name")?.textContent ||
            "N/A";
          const team2 =
            eventMatch.querySelector(".team.team2 h2 .name")?.textContent ||
            "N/A";
          const winner = hasWinner
            ? matchClasses.contains("winner-team2")
              ? team2
              : team1
            : "";
          if (eventMatch) {
            const iconTeam1 =
              eventMatch.querySelector(".team.team1 img")?.src || "No IMG";
            const score1 =
              eventMatch.querySelector(".score .scoreTeam1")?.textContent ||
              "N/A";
            const score2 =
              eventMatch.querySelector(".score .scoreTeam2")?.textContent ||
              "N/A";
            const team2 =
              eventMatch.querySelector(".team.team2 h2 .name")?.textContent ||
              "N/A";
            const iconTeam2 =
              eventMatch.querySelector(".team.team2 img")?.src || "No IMG";

            date.matches.push({
              Winner: winner,
              Team1: team1,
              Icon1: iconTeam1,
              Score1: score1,
              Score2: score2,
              Team2: team2,
              Icon2: iconTeam2,
            });
          }
        }
      });

      return holder;
    });
    const responseJson = JSON.stringify(response, null, 2);

    fs.writeFile("results.json", responseJson, (err) => {
      if (err) throw err;
      console.log("file saved");
    });

    await browser.close();
  } catch (error) {
    console.error("Error: ", error);
  }
}

run();
