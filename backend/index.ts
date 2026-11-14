import express from "express";
import gild from "gold-janus";

const app = express();
const isProd = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3010);

void gild(app, {
  port,
  dev: !isProd,
});
