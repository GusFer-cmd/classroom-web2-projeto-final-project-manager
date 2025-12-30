const express = require("express");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ ok: true, message: "Api Back funcionando" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));