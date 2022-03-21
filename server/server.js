import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\/|\/$/g, ""),
  API_VERSION: '2021-10',//ApiVersion.October20,
  IS_EMBEDDED_APP: true,

  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};

Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED", {
  path: "/webhooks",
  webhookHandler: async (topic, shop, body) =>
    delete ACTIVE_SHOPIFY_SHOPS[shop],
});

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {

        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;
        ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const responses = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
        });

        if (!responses["APP_UNINSTALLED"].success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${responses.result}`
          );
        }
        console.log(accessToken);
        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    // console.log('pos3333333333');
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  // router.get("/carrier_services", async (ctx) => {
  //   //const { shop, accessToken } = ctx.session;
  //   const { shop, accessToken } = ctx.state.shopify;
  //   const res = await fetch(
  //     `https://${SHOPIFY_API_KEY}:${accessToken}@${shop}/admin/api/2020-10/carrier_services.json`
  //   );
  //   ctx.body = await res.json();
  //   ctx.status = 200;
  // });

  router.get("/carrier_services", verifyRequest(), async (ctx) => {
    console.log('pppppppppppppppppppp');
    console.log(ctx);
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    console.log(session);
    const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
    //const { shop, accessToken, scope } = ctx.state.shopify;
    //const client = new Shopify.Clients.Rest(shop, accessToken);
    ctx.body = await client.get({
      path: 'carrier_services',
    });
    ctx.status = 200;
  });

  //router.post("/carrier_services", verifyRequest(), handleRequest);
  // router.post("/carrier_services.json", verifyRequest(), async ctx => {
  //   ctx.body = ctx.request.body;
  //   ctx.res.statusCode = 200;
  // });

  router.delete("/carrier_services.json/:carrierListId", verifyRequest(), async (ctx) => {
    // let { carrierList } = ctx.req.carrierList;
    console.log('del5555555');
    //console.log(carrierList);
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
    ctx.body = await client.delete({
      path: `carrier_services/${ctx.params.carrierListId}`,
    });
    ctx.status = 200;
  });

  router.post("/carrier_services.json", verifyRequest(), async (ctx) => {

    console.log(ctx);
    console.log('pos24444444442');

    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    console.log(session);
    const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
    //const { shop, accessToken, scope } = ctx.state.shopify;
    //const client = new Shopify.Clients.Rest(shop, accessToken);
    ctx.body = await client.post({
      path: 'carrier_services',
      type: 'application/json',
      data: {
        carrier_service: {
          name: 'TransVirtual1',
          callback_url: 'https://transvirtual2103.free.beeceptor.com',
          service_discovery: true
        }
      },
    });
    ctx.status = 200;
  });

  //router.post("/carrier_services.json", verifyRequest(), handleRequest);


  // router.get("/carrier_services", async (ctx) => {
  //   const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
  //   // Create a new client for the specified shop.
  //   const client = new Shopify.Clients.Rest(session.shop, session.accessToken);
  //   // Use `client.get` to request the specified Shopify REST API endpoint, in this case `products`.
  //   const carrier_services = await client.get({
  //     path: 'carrier_services',
  //   });
  //   ctx.body = carrier_services;
  //   ctx.status = 200;
  // });

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
