import App from "./app";
import routes from "./routes";

export const app = new App(routes);
app.listen();
