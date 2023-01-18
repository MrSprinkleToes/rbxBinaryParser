const express = require("express");
const app = express();

app.use("/", express.static(__dirname));
app.use("/dist", express.static(__dirname + "/../../dist/client"));

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

app.listen(8080, () => {
	console.log("Server started on port 8080");
});
