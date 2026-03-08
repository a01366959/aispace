import intentRoutingPolicy from "../policies/intent-routing.json";
import modelRoutingPolicy from "../policies/model-routing.json";
import { runIntentRouter } from "./workflowEngine";

const decision = runIntentRouter(
  {
    message: "Client has not replied after proposal. Create follow-up and suggest next action.",
    threadContext: "Hospital ABC quote thread",
    dealContext: "Stage: proposal_sent; value: 22000",
    riskFlags: ["external_outbound"]
  },
  intentRoutingPolicy,
  modelRoutingPolicy
);

console.log(JSON.stringify(decision, null, 2));
