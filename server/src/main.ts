import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import {
	DEV,
	URL as METAVERSE_URL,
	WWW_PATH,
	FILES_URL,
	WORLD_URL,
	TEA_URL,
} from "./environment";
import { initFrontend } from "./frontend";

function initSwagger(app: NestExpressApplication) {
	const options = new DocumentBuilder()
		.setTitle("Metaverse API")
		.setDescription("The official unofficial implementation")
		.setVersion("indev")
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, options);

	app.use("/api.json", (req: Request, res: Response) => {
		res.send(document);
	});
	SwaggerModule.setup("api", app, document);
}

function initDebugLogs(app: NestExpressApplication, logger: Logger) {
	const teaHostname = new URL(TEA_URL).hostname;

	app.use((req: Request, res: Response, next: () => void) => {
		if (req.hostname == teaHostname) return next();
		bodyParser.json()(req, res, () => {
			bodyParser.urlencoded({
				extended: true,
			})(req, res, () => {
				logger.verbose(req.method + " " + req.originalUrl); // tslint:disable-line
				logger.verbose("auth: " + req.headers.authorization); // tslint:disable-line
				logger.verbose("body: " + JSON.stringify(req.body, null, 4)); // tslint:disable-line
				logger.verbose("");
				next();
			});
		});
	});
}

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	const logger = new Logger("HttpServer");

	// https://expressjs.com/en/guide/behind-proxies.html
	app.set("trust proxy", 1);

	app.enableCors({
		origin: [
			"null", // chrome file://
			"file://",
			new URL(METAVERSE_URL).origin,
			new URL(FILES_URL).origin,
			new URL(WORLD_URL).origin,
			new URL(TEA_URL).origin,
		],
	});

	if (!DEV)
		app.use((req: Request, res: Response, next: () => any) => {
			if (
				req.headers["x-forwarded-proto"] === "http" ||
				req.headers.host.includes("appspot.com")
			) {
				res.redirect(METAVERSE_URL + req.originalUrl);
			} else {
				next();
			}
		});

	// const hostWildcard = "*." + new URL(METAVERSE_URL).host;

	app.use(
		helmet({
			contentSecurityPolicy: false,
		}),

		// https://helmetjs.github.io/docs/csp/
		// TODO: finish csp
		// helmet.contentSecurityPolicy({
		// 	directives: {
		// 		defaultSrc: ["'self'"],
		// 		scriptSrc: ["'self'", "'unsafe-inline'", hostWildcard],
		// 		styleSrc: ["'self'", "'unsafe-inline'", hostWildcard],
		// 	},
		// }),

		// compression(),
		cookieParser(),
	);

	app.useGlobalPipes(
		new ValidationPipe({
			// disableErrorMessages: true,
			// dismissDefaultMessages: true,
			validationError: { target: false, value: false },
			transform: true,
		}),
	);

	if (DEV) {
		initDebugLogs(app, logger);
		initSwagger(app);
	}

	initFrontend(app);

	/// www path
	if (WWW_PATH) app.useStaticAssets(WWW_PATH);

	// redirects
	const redirects = {
		"/discord": "https://discord.gg/FhuzTwR",
		"/docs": "https://docs.tivolicloud.com",
	};

	for (const [path, redirect] of Object.entries(redirects)) {
		app.use(path, (_, res: Response) => {
			res.redirect(redirect);
		});
	}

	const port = process.env.PORT || 3000;
	await app.listen(port, () => {
		logger.log("Server listening on *:" + port);
	});
}

bootstrap();
