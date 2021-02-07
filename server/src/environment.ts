import fs from "fs";

// environment.dev.ts

// export default {
// 	URL: "http://127.0.0.1:3000",
// };

let environmentDev: object;
if (fs.existsSync(__dirname + "/environment.dev.js")) {
	environmentDev = require("./environment.dev").default;
}

export const {
	URL = "http://127.0.0.1:3000",
	DEV = false,

	WWW_PATH = "",

	DB_URI = "mongodb://localhost",
	DB_NAME = "metaverse",

	EMAIL_USER = "",
	EMAIL_PASS = "",
	EMAIL_NAME = "",

	FILES_URL = "http://files.localhost:3000",
	FILES_GCP_PROJECT_ID = "tivolicloud",
	FILES_GCP_BUCKET = "tivolicloud-dev",
	// https://console.cloud.google.com/apis/credentials/wizard?api=storage-api.googleapis.com
	FILES_GCP_AUTH_JSON = "{}",

	WORLD_URL = "http://world.localhost:3000",
	TEA_URL = "http://tea.localhost:3000",

	ZOOM_API_KEY = "0nB3LiC_RiedIJgIU9QRAw",
	ZOOM_API_SECRET = "J6wg3LD6FA32BtP3pnKdBeYsCBeUgu44I7rh",

	OPENAI_API_KEY = "",

	JWT_SECRET = "thisIsSoVerySecretyou literally have no idealol1610239012",

	METRICS_SECRET = "",

	// https://console.cloud.google.com/apis/credentials
	AUTH_GOOGLE_ID = " ",
	AUTH_GOOGLE_SECRET = " ",

	// https://discordapp.com/developers/applications
	AUTH_DISCORD_ID = " ",
	AUTH_DISCORD_SECRET = " ",

	// https://github.com/settings/developers
	AUTH_GITHUB_ID = " ",
	AUTH_GITHUB_SECRET = " ",
} = environmentDev ? { ...process.env, ...environmentDev } : process.env;
