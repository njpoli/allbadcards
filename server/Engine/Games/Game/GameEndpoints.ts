import {Express} from "express";
import {GameManager} from "./GameManager";
import {CardManager} from "../Cards/CardManager";
import apicache from "apicache";
import {ICardPackSummary} from "./GameContract";
import {UserUtils} from "../../User/UserUtils";
import shortid from "shortid";
import {GameListManager} from "./GameListManager";
import {PackManager} from "../Cards/PackManager";
import {logRequest, onExpressError, playerFromReq, sendWithBuildVersion} from "../../../Utils/ExpressUtils";

const cache = apicache.middleware;

export const RegisterGameEndpoints = (app: Express, clientFolder: string) =>
{
	app.get("/api/user/register", async (req, res) =>
	{
		try
		{
			let guid = req.cookies["guid"];
			if (!guid)
			{
				guid = shortid.generate();
				const secret = UserUtils.generateSecret(guid);

				const expires = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));

				res.cookie("secret", secret, {
					httpOnly: true,
					expires
				});

				res.cookie("guid", guid, {
					expires
				});
			}

			res.send({
				guid
			});
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/games/public", cache("15 seconds"), async (req, res) =>
	{
		logRequest(req);

		try
		{
			const games = await GameListManager.getGames(parseInt(req.query.zeroBasedPage));
			sendWithBuildVersion({games}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/game/get", cache("10 seconds"), async (req, res, next) =>
	{
		logRequest(req);

		try
		{
			const game = await GameManager.getGame(req.query.gameId);
			sendWithBuildVersion(game, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/game/get-white-card", cache("1 hour"), async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const card = await CardManager.getWhiteCard({
				cardIndex: parseInt(req.query.cardIndex),
				packId: req.query.packId
			});

			res.send({
				card
			});
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/game/get-packnames", cache("1 hour"), async (req, res, next) =>
	{
		try
		{
			let packIds: string[];
			const which = req.query.type;
			switch (which)
			{
				case "all":
					packIds = PackManager.packTypeDefinition.types.reduce((acc, type) =>
					{
						acc.push(...type.packs);
						return acc;
					}, [] as string[]);
					break;
				case "official":
					packIds = PackManager.packTypeDefinition.types[0].packs;
					break;
				case "thirdParty":
					packIds = PackManager.packTypeDefinition.types[1].packs;
					break;
				case "family":
					packIds = ["family_edition"];
					break;
				default:
					throw new Error("No pack type " + which + " exists!");
			}

			const packs = packIds.map(packId =>
			{
				const packDef = PackManager.packs[packId];
				return {
					name: packDef.pack.name,
					quantity: packDef.quantity,
					isOfficial: PackManager.packTypeDefinition.types[0].packs.includes(packId),
					packId
				} as ICardPackSummary
			});
			res.send(packs);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("/api/game/get-black-card", cache("1 hour"), async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const card = await CardManager.getBlackCard({
				packId: req.query.packId,
				cardIndex: parseInt(req.query.cardIndex)
			});

			res.send(card);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/create", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			const game = await GameManager.createGame(player, req.body.nickname);
			sendWithBuildVersion({
				id: game.id
			}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/join", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.joinGame(
				player,
				req.body.gameId,
				req.body.nickname,
				JSON.parse(req.body.isSpectating ?? "false"),
				false);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/kick", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.kickPlayer(req.body.gameId, req.body.targetGuid, player);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/start", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.startGame(
				req.body.gameId,
				player,
				req.body.settings);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/update-settings", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.updateSettings(
				req.body.gameId,
				player,
				req.body.settings);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/restart", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			let game = await GameManager.restartGame(req.body.gameId, player);
			await GameManager.startGame(
				game.id,
				player,
				game.settings
			);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/play-cards", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.playCard(req.body.gameId, player, req.body.cardIds);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/play-cards-custom", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.playCardsCustom(req.body.gameId, player, req.body.cards);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/forfeit", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.forfeit(req.body.gameId, player, req.body.playedCards);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/reveal-next", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.revealNext(req.body.gameId, player);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/skip-black", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.skipBlack(req.body.gameId, player);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/start-round", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.startRound(req.body.gameId, player);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/add-random-player", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.addRandomPlayer(req.body.gameId, player);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/select-winner-card", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.selectWinnerCard(req.body.gameId, player, req.body.winningPlayerGuid);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/send-chat", async(req, res) => {
		logRequest(req);
		try
		{
			const player = playerFromReq(req);

			await GameManager.updateRedisChat(player, {
				gameId: req.body.gameId,
				message: escape(req.body.message),
				playerGuid: player.guid
			});

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.post("/api/game/next-round", async (req, res, next) =>
	{
		logRequest(req);
		try
		{
			const player = playerFromReq(req);
			await GameManager.nextRound(req.body.gameId, player);

			sendWithBuildVersion({success: true}, res);
		}
		catch (error)
		{
			onExpressError(res, error, req.url, req.query, req.body);
		}
	});

	app.get("*", (req, res) =>
	{
		res.sendFile("index.html", {root: clientFolder});
	});
};