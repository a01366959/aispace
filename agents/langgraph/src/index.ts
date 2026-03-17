import intentRoutingPolicy from "../policies/intent-routing.json";
import modelRoutingPolicy from "../policies/model-routing.json";
import { runIntentRouter } from "./workflowEngine";

const decision = runIntentRouter(
  {
    message: "Cerveceria Toluca no responde desde hace 6 dias. Abre el mejor hilo y prepara el siguiente paso.",
    entryPoint: "main_chat",
    threadContext: "Chat principal de GDT",
    dealContext: "Etapa: cotizacion_enviada; valor: 285000",
    riskFlags: ["external_outbound"]
  },
  intentRoutingPolicy,
  modelRoutingPolicy
);

console.log(JSON.stringify(decision, null, 2));
