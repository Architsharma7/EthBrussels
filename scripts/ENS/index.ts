import express from "express";
import type { Request, Response } from "express";
import { mintSubname } from "./mintSubname";

const app = express();
app.use(express.json());

app.get("/create/subname", async (req: Request, res: Response) => {
  if (req.method != "POST") {
    return res.status(404).send({ message: "Method not allowed" });
  }

  // extract the subname & the user address from the request body
  const { subName, userAddress } = req.body;
  if (!subName && !userAddress) {
    return res.status(404).send({ message: "User info not found" });
  }

  const txHash = await mintSubname(subName, userAddress);
  console.log("Transaction Hash : ", txHash);
  return res.send({ hash: txHash });
});

app.listen(3010, () => {
  console.log("listening on port 3010");
});
