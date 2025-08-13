import express from "express";

const app = express();
app.use(express.json());


const P_C  = Number(10);        // MPa
const V_C  = Number(0.0035);    // m^3/kg
const P1   = Number(0.05);      // MPa (ancla baja del dibujo)
const VF1  = Number(0.00105);   // m^3/kg (líquido en P1)
const VG1  = Number( 30.0);      // m^3/kg (vapor en P1)

// Calcula v_f y v_g para una presión P (MPa) siguiendo líneas rectas hasta Pc
function saturationsAtPressure(P: number) {
    if (!Number.isFinite(P) || P <= 0) {
        throw new Error("pressure must be a positive number in MPa");
    }

    // Región Pc en adelante: se colapsa en el punto crítico
    if (P >= P_C) {
        return { specific_volume_liquid: V_C, specific_volume_vapor: V_C };
    }

    if (P <= P1) {
        return { specific_volume_liquid: VF1, specific_volume_vapor: VG1 };
    }

    const t = (P_C - P) / (P_C - P1); // t=1 en P1, t=0 en Pc
    const vf = V_C - (V_C - VF1) * t; // rama de líquido
    const vg = V_C + (VG1 - V_C) * t; // rama de vapor

    return { specific_volume_liquid: vf, specific_volume_vapor: vg };
}

app.get("/phase-change-diagram", (req, res) => {
    try {
        const P = parseFloat(String(req.query.pressure ?? ""));
        const out = saturationsAtPressure(P);
        res.json(out);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.get("/", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`GET /phase-change-diagram?pressure=10  -> crítico`);
});
