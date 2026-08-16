type Field = {
  key: string;
  label: string;
  unit?: string;
  type?: "number" | "date" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
};

type CalcDefinition = {
  title: string;
  subtitle: string;
  fields: Field[];
  calculate: (values: Record<string, string>) => { value: string; unit?: string; interpretation: string };
  formula: string;
  source: string;
  sourceUrl?: string;
};

type ScoreDefinition = {
  title: string;
  subtitle: string;
  rows: { key: string; label: string; options: { label: string; value: number }[] }[];
  interpret: (score: number) => string;
  source: string;
  sourceUrl?: string;
};

type ReferenceDefinition = {
  title: string;
  subtitle: string;
  columns: string[];
  rows: string[][];
  notes: string[];
  source: string;
  sourceUrl?: string;
};

const n = (v: Record<string, string>, key: string) => Number(v[key]);
const num = (label: string, key: string, unit: string, placeholder: string, extra: Partial<Field> = {}): Field => ({ label, key, unit, placeholder, type: "number", step: "any", ...extra });
const select = (label: string, key: string, options: [string, string][]): Field => ({ label, key, type: "select", options: options.map(([optionLabel, value]) => ({ label: optionLabel, value })) });
const noYes = (points = 1) => [{ label: "No", value: 0 }, { label: "Sí", value: points }];
const absentPresent = (points: number) => [{ label: "Ausente", value: 0 }, { label: "Presente", value: points }];
const categorical = (title: string, subtitle: string, fields: Field[], calculate: CalcDefinition["calculate"], source: string, sourceUrl: string): CalcDefinition => ({ title, subtitle, fields, calculate, formula: "Algoritmo categórico publicado; no sumar criterios fuera de la regla indicada", source, sourceUrl });

export const extendedCalculators: Record<string, CalcDefinition> = {
  "Unidad de cuidados intensivos pediátricos": categorical(
    "Evaluación pediátrica de gravedad",
    "Triángulo de evaluación pediátrica para reconocer insuficiencia respiratoria, shock o disfunción neurológica",
    [
      select("Apariencia", "appearance", [["Normal", "normal"], ["Anormal: tono, interacción, consolabilidad, mirada o habla/llanto", "abnormal"]]),
      select("Trabajo respiratorio", "breathing", [["Normal", "normal"], ["Anormal: sonidos, postura, retracciones o aleteo", "abnormal"]]),
      select("Circulación cutánea", "circulation", [["Normal", "normal"], ["Anormal: palidez, moteado o cianosis", "abnormal"]]),
    ],
    (v) => {
      const a = v.appearance === "abnormal", b = v.breathing === "abnormal", c = v.circulation === "abnormal";
      const count = [a, b, c].filter(Boolean).length;
      const pattern = !count ? "Estable por apariencia inicial" : b && !a && !c ? "Dificultad respiratoria" : b && a && !c ? "Insuficiencia respiratoria" : c && !a ? "Shock compensado" : c && a ? "Shock descompensado o falla cardiorrespiratoria" : "Disfunción neurológica/metabólica";
      return { value: pattern, interpretation: `${count}/3 lados anormales. Es una impresión inicial de segundos: continúa ABCDE, constantes por edad y escalamiento según respuesta; no decide por sí sola ingreso en UCI.` };
    },
    "American Academy of Pediatrics — Pediatric Education for Prehospital Professionals / Pediatric Assessment Triangle",
    "https://publications.aap.org/pediatrics/article/125/4/773/73127/Pediatric-Assessment-Triangle-A-Novel-Approach"
  ),
  "Flujo espiratorio máximo predicho": {
    title: "PEF pediátrico predicho por talla",
    subtitle: "Ecuaciones publicadas para niños sanos de 5–14 años; la referencia local y el mejor personal tienen prioridad",
    fields: [select("Sexo biológico", "sex", [["Masculino", "m"], ["Femenino", "f"]]), num("Talla", "height", "cm", "140", { min: 90, max: 200 })],
    calculate: (v) => {
      const height = n(v, "height");
      const pef = v.sex === "m" ? 4.39 * height - 300.48 : 4.13 * height - 278.04;
      return { value: Math.max(0, pef).toFixed(0), unit: "L/min", interpretation: "Estimación poblacional. Para planes de asma, compara preferentemente con el mejor PEF personal estable y usa el espirómetro/medidor con técnica correcta." };
    },
    formula: "Niños: 4,39×talla−300,48; niñas: 4,13×talla−278,04",
    source: "Zhang et al. — PEF en niños sanos de 5–14 años",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/29707287/",
  },
  "Dosis antimicrobianas en neonatos": {
    title: "Conversión de una pauta neonatal prescrita",
    subtitle: "Calcula dosis y volumen; la selección de fármaco, mg/kg e intervalo debe provenir de una guía neonatal vigente",
    fields: [num("Peso", "weight", "kg", "2.8", { min: 0.3, max: 10 }), num("Dosis prescrita", "dose", "mg/kg/dosis", "50", { min: 0.001 }), num("Concentración preparada", "concentration", "mg/mL", "100", { min: 0.001 }), num("Intervalo", "interval", "horas", "12", { min: 1, max: 72 })],
    calculate: (v) => {
      const mg = n(v, "weight") * n(v, "dose");
      const volume = mg / n(v, "concentration");
      const daily = mg * 24 / n(v, "interval");
      return { value: mg.toFixed(2), unit: "mg por dosis", interpretation: `${volume.toFixed(2)} mL por dosis; ${daily.toFixed(2)} mg/día. Verifica edad gestacional y posnatal, función renal, indicación, dilución, velocidad y límites máximos en el formulario neonatal institucional.` };
    },
    formula: "mg/dosis = kg × mg/kg/dosis; mL = mg ÷ mg/mL",
    source: "WHO — Pocket Book of Hospital Care for Children (dosis pediátricas y neonatales)",
    sourceUrl: "https://www.who.int/publications/i/item/978-92-4-154837-3",
  },
  "Interacción fármaco–alimento": categorical(
    "Comprobador de interacciones fármaco–alimento seleccionadas",
    "Consulta rápida no exhaustiva basada en fichas regulatorias; confirma siempre el producto concreto",
    [select("Combinación", "pair", [
      ["Warfarina + cambios bruscos de vitamina K", "warfarin"], ["Levotiroxina + alimentos/calcio/hierro", "thyroxine"],
      ["Tetraciclina/fluoroquinolona + calcio/hierro", "chelation"], ["Simvastatina/lovastatina + pomelo", "grapefruit"],
      ["IMAO + alimentos ricos en tiramina", "maoi"], ["Metronidazol + alcohol", "alcohol"],
    ])],
    (v) => {
      const advice: Record<string, string> = {
        warfarin: "Mantén una ingesta de vitamina K consistente; no es necesario eliminar verduras. Cambios importantes requieren control de INR.",
        thyroxine: "Administrar de forma consistente en ayunas; separar calcio/hierro al menos 4 horas según ficha del producto.",
        chelation: "Cationes multivalentes reducen absorción. Respeta la separación horaria específica de la ficha del antibiótico.",
        grapefruit: "El pomelo puede aumentar exposición a ciertas estatinas metabolizadas por CYP3A4; evita la combinación indicada en la ficha.",
        maoi: "Evita alimentos con alta tiramina por riesgo de crisis hipertensiva; requiere educación dietaria específica.",
        alcohol: "Evita alcohol durante el tratamiento y por el período posterior indicado en la ficha técnica.",
      };
      return { value: "Interacción relevante", interpretation: advice[v.pair] ?? "Combinación no reconocida." };
    },
    "FDA — Avoid Food-Drug Interactions / fichas oficiales de medicamentos",
    "https://www.fda.gov/consumers/consumer-updates/avoiding-drug-interactions"
  ),
  "Interacciones farmacológicas": categorical(
    "Cribado de combinaciones farmacológicas de alto riesgo",
    "No sustituye una base de interacciones actualizada ni la revisión de todos los medicamentos",
    [select("Combinación", "pair", [
      ["Nitrato + inhibidor PDE5", "nitrate"], ["Opioide + benzodiacepina", "opioid"], ["Dos fármacos que prolongan QT", "qt"],
      ["IECA/ARA-II + espironolactona/suplemento K", "potassium"], ["Anticoagulante + AINE", "bleeding"], ["Serotonérgicos múltiples", "serotonin"],
    ])],
    (v) => {
      const result: Record<string, [string, string]> = {
        nitrate: ["Contraindicada", "Riesgo de hipotensión profunda. No administrar conjuntamente; respeta el período de separación específico del PDE5."],
        opioid: ["Alerta máxima", "Mayor riesgo de sedación profunda y depresión respiratoria. Evitar si es posible; si es imprescindible, limitar dosis/duración y monitorizar."],
        qt: ["Riesgo aditivo", "Revisa QTc, electrolitos, función renal/hepática y alternativas; el riesgo depende de cada fármaco y del paciente."],
        potassium: ["Riesgo de hiperpotasemia", "Evita combinaciones innecesarias y monitoriza potasio y función renal."],
        bleeding: ["Riesgo hemorrágico", "Evita AINE si es posible; valora gastroprotección y signos de sangrado."],
        serotonin: ["Riesgo serotoninérgico", "Revisa dosis, transiciones y períodos de lavado; vigila clonus, hiperreflexia, agitación, fiebre y diarrea."],
      };
      const [value, interpretation] = result[v.pair] ?? ["—", "Combinación no reconocida"];
      return { value, interpretation };
    },
    "FDA — Drug Interactions: What You Should Know",
    "https://www.fda.gov/drugs/resources-you-drugs/drug-interactions-what-you-should-know"
  ),
  "Sobredosis de paracetamol y dosificación de NAC": {
    title: "N-acetilcisteína en sobredosis aguda de paracetamol",
    subtitle: "Calcula dosis de los regímenes estándar; consulta toxicología y adapta volumen/velocidad al producto y peso",
    fields: [num("Peso", "weight", "kg", "70", { min: 0.5, max: 300 }), select("Régimen", "regimen", [["IV 21 h: carga 150 mg/kg", "iv1"], ["IV 21 h: segunda 50 mg/kg", "iv2"], ["IV 21 h: tercera 100 mg/kg", "iv3"], ["Oral: carga 140 mg/kg", "oral1"], ["Oral: mantenimiento 70 mg/kg cada 4 h", "oral2"]])],
    calculate: (v) => {
      const factors: Record<string, [number, string]> = { iv1: [150, "en 1 hora"], iv2: [50, "en 4 horas"], iv3: [100, "en 16 horas"], oral1: [140, "dosis de carga"], oral2: [70, "cada 4 horas; 17 dosis en el esquema clásico"] };
      const [factor, timing] = factors[v.regimen];
      return { value: (n(v, "weight") * factor).toFixed(0), unit: "mg", interpretation: `${factor} mg/kg ${timing}. Iniciar sin esperar concentración si han pasado >8 h y la sospecha es significativa; continuar/terminar según paracetamol, ALT/AST, INR y estado clínico, con toxicología.` };
    },
    formula: "dosis (mg) = peso (kg) × dosis del tramo (mg/kg)",
    source: "Dart et al. — consenso de EE. UU. y Canadá 2023 para intoxicación por paracetamol",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/37552484/",
  },
  "Nomograma de toxicidad por paracetamol": {
    title: "Nomograma de Rumack–Matthew (línea de tratamiento 150)",
    subtitle: "Solo para ingesta aguda única, hora conocida y concentración entre 4 y 24 horas",
    fields: [num("Horas desde la ingesta", "hours", "h", "4", { min: 4, max: 24 }), num("Paracetamol sérico", "level", "µg/mL = mg/L", "150", { min: 0 })],
    calculate: (v) => {
      const threshold = 150 * Math.pow(0.5, (n(v, "hours") - 4) / 4);
      const above = n(v, "level") >= threshold;
      return { value: above ? "Sobre la línea" : "Bajo la línea", interpretation: `Umbral aproximado a esa hora: ${threshold.toFixed(1)} µg/mL. ${above ? "Indica NAC en una ingesta elegible para el nomograma." : "No indica NAC por el nomograma aislado."} No usar en hora desconocida, ingestas repetidas, presentación tardía o formulación de liberación prolongada sin muestreo seriado.` };
    },
    formula: "línea 150 µg/mL a 4 h, semivida de 4 h",
    source: "Dart et al. — consenso 2023 para intoxicación por paracetamol",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/37552484/",
  },
  "Algoritmo PECARN para traumatismo craneal pediátrico": categorical(
    "PECARN para traumatismo craneal menor",
    "Reglas separadas para menores de 2 años y desde 2 años; aplicar con GCS 14–15 y trauma contuso reciente",
    [
      select("Edad", "age", [["<2 años", "under2"], ["≥2 años", "over2"]]),
      select("GCS / estado mental", "mental", [["GCS 15 y estado mental normal", "normal"], ["GCS 14 o estado mental alterado", "altered"]]),
      select("Fractura de cráneo", "fracture", [["Sin signos", "none"], ["Palpable (<2 años)", "palpable"], ["Signos de base (≥2 años)", "basilar"]]),
      select("Factor intermedio", "intermediate", [["Ninguno", "none"], ["Hematoma no frontal (<2)", "hematoma"], ["Pérdida de conciencia ≥5 s (<2)", "loc5"], ["No actúa normal según padres (<2)", "abnormal"], ["Pérdida de conciencia (≥2)", "loc"], ["Vómitos (≥2)", "vomit"], ["Cefalea grave (≥2)", "headache"], ["Mecanismo grave", "mechanism"]]),
    ],
    (v) => {
      if (v.mental === "altered" || (v.age === "under2" && v.fracture === "palpable") || (v.age === "over2" && v.fracture === "basilar")) return { value: "TC recomendada", interpretation: `Rama de alto riesgo PECARN; riesgo de lesión cerebral traumática clínicamente importante alrededor de ${v.age === "under2" ? "4,4" : "4,3"}% en la cohorte original.` };
      if (v.intermediate !== "none") return { value: "Observación vs TC", interpretation: `Rama intermedia PECARN; riesgo aproximado ${v.age === "under2" ? "0,9" : "0,8"}%. Decide según combinación/número de factores, empeoramiento, edad, experiencia y preferencia informada.` };
      return { value: "TC no recomendada", interpretation: `Muy bajo riesgo PECARN (${v.age === "under2" ? "<0,02" : "<0,05"}%). Mantén instrucciones de alarma y reevaluación; la regla no cubre trauma penetrante, sospecha de maltrato ni GCS <14.` };
    },
    "Kuppermann et al. — derivación y validación PECARN",
    "https://pubmed.ncbi.nlm.nih.gov/19758692/"
  ),
  "Score para infección respiratoria baja": {
    title: "Frecuencia respiratoria para sospecha de neumonía infantil",
    subtitle: "Clasificación OMS por edad en niños con tos o dificultad respiratoria; requiere evaluar signos de peligro",
    fields: [select("Edad", "age", [["2–11 meses", "infant"], ["12–59 meses", "child"]]), num("Frecuencia respiratoria", "rr", "resp/min", "45", { min: 0, max: 150 })],
    calculate: (v) => {
      const threshold = v.age === "infant" ? 50 : 40;
      const fast = n(v, "rr") >= threshold;
      return { value: fast ? "Respiración rápida" : "No rápida", interpretation: `Umbral OMS: ≥${threshold}/min. La tirada subcostal, estridor en reposo, hipoxemia o signos generales de peligro cambian la clasificación y exigen atención urgente.` };
    },
    formula: "2–11 meses ≥50/min; 12–59 meses ≥40/min",
    source: "OMS — IMCI chart booklet",
    sourceUrl: "https://www.who.int/publications/i/item/9789241506823",
  },
  "Volumen de recambio eritrocitario en enfermedad falciforme": {
    title: "Volumen estimado de recambio eritrocitario",
    subtitle: "Estimación manual del volumen de glóbulos rojos requerido para alcanzar un hematocrito objetivo",
    fields: [num("Peso", "weight", "kg", "60", { min: 1 }), num("Volumen sanguíneo", "ebv", "mL/kg", "70", { min: 50, max: 100 }), num("Hematocrito inicial", "initial", "%", "24", { min: 1, max: 80 }), num("Hematocrito objetivo", "target", "%", "30", { min: 1, max: 80 }), num("Hematocrito de la unidad", "unit", "%", "60", { min: 20, max: 90 })],
    calculate: (v) => {
      const blood = n(v, "weight") * n(v, "ebv");
      const volume = blood * (n(v, "target") - n(v, "initial")) / n(v, "unit");
      if (volume <= 0) return { value: "—", interpretation: "El hematocrito objetivo debe superar al inicial para esta estimación simple. El recambio automatizado requiere software del dispositivo y objetivos HbS/Hct." };
      return { value: volume.toFixed(0), unit: "mL de eritrocitos", interpretation: "Estimación de reposición simple, no programa un recambio automatizado. Coordina con medicina transfusional y usa HbS objetivo, balance de hematocrito y parámetros específicos del equipo." };
    },
    formula: "V ≈ volumen sanguíneo × (Hct objetivo−Hct inicial) ÷ Hct de la unidad",
    source: "American Society for Apheresis — principios de recambio eritrocitario",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/31180581/",
  },
};

export const extendedScores: Record<string, ScoreDefinition> = {
  "Criterios SIRS, sepsis y shock séptico pediátrico": {
    title: "Phoenix Sepsis Score 2024",
    subtitle: "Criterio pediátrico actual para sepsis en infección sospechada; no aplicable a prematuros con edad posconcepcional <37 semanas",
    rows: [
      { key: "resp", label: "Disfunción respiratoria", options: [{ label: "Sin criterio", value: 0 }, { label: "1 punto según soporte/oxigenación", value: 1 }, { label: "2 puntos", value: 2 }, { label: "3 puntos", value: 3 }] },
      { key: "cardio", label: "Disfunción cardiovascular", options: [{ label: "Sin criterio", value: 0 }, { label: "1 punto", value: 1 }, { label: "2 puntos", value: 2 }, { label: "3 puntos", value: 3 }, { label: "4 puntos", value: 4 }, { label: "5 puntos", value: 5 }, { label: "6 puntos", value: 6 }] },
      { key: "coag", label: "Disfunción de coagulación", options: [{ label: "Sin criterio", value: 0 }, { label: "1 punto", value: 1 }, { label: "2 puntos", value: 2 }] },
      { key: "neuro", label: "Disfunción neurológica", options: [{ label: "Sin criterio", value: 0 }, { label: "1 punto", value: 1 }, { label: "2 puntos", value: 2 }] },
    ],
    interpret: (s) => s >= 2 ? `Phoenix ${s}: cumple criterio de sepsis si existe infección sospechada o confirmada. Shock séptico requiere además ≥1 punto cardiovascular.` : `Phoenix ${s}: no alcanza el umbral de sepsis (≥2), pero no excluye infección grave ni deterioro; reevaluar en serie.`,
    source: "SCCM Pediatric Sepsis Definition Task Force — criterios Phoenix 2024",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10900966/",
  },
  "Regla CATCH para traumatismo craneal pediátrico": {
    title: "CATCH",
    subtitle: "Niños con traumatismo craneal menor dentro de 24 h y criterios de inclusión de la regla",
    rows: [
      { key: "gcs", label: "GCS <15 a las 2 horas", options: noYes() }, { key: "open", label: "Sospecha de fractura abierta/deprimida", options: noYes() },
      { key: "headache", label: "Cefalea que empeora", options: noYes() }, { key: "irritability", label: "Irritabilidad en el examen", options: noYes() },
      { key: "basal", label: "Signos de fractura de base", options: noYes() }, { key: "hematoma", label: "Hematoma grande y blando del cuero cabelludo", options: noYes() },
      { key: "mechanism", label: "Mecanismo peligroso", options: noYes() },
    ],
    interpret: (s) => s === 0 ? "CATCH negativa dentro de su población elegible; no excluye lesión fuera de los criterios de la regla." : `CATCH positiva: ${s} criterio(s). Los cuatro primeros son de alto riesgo para intervención neurológica; cualquiera de los siete apoya TC para lesión cerebral en la regla original.`,
    source: "Osmond et al. — CATCH derivación",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/20142371/",
  },
  "Criterios King's College por toxicidad de paracetamol": {
    title: "King's College — falla hepática por paracetamol",
    subtitle: "Criterios pronósticos para derivación/valoración urgente de trasplante",
    rows: [
      { key: "ph", label: "pH arterial <7,30 tras reanimación", options: noYes(10) },
      { key: "lactate", label: "Lactato >3,0 mmol/L tras reanimación adecuada", options: noYes(10) },
      { key: "inr", label: "INR >6,5", options: noYes(1) }, { key: "creatinine", label: "Creatinina >300 µmol/L (3,4 mg/dL)", options: noYes(1) }, { key: "encephalopathy", label: "Encefalopatía grado III–IV", options: noYes(1) },
    ],
    interpret: (s) => s >= 10 ? "Cumple por acidosis/lactato: valoración inmediata por centro de trasplante." : s === 3 ? "Cumple la tríada INR + creatinina + encefalopatía: valoración inmediata por centro de trasplante." : "No cumple el conjunto seleccionado; no descarta deterioro ni elimina la necesidad de consulta temprana con un centro hepático.",
    source: "O'Grady et al. — criterios King's College; revisión de falla hepática aguda",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10836844/",
  },
  "Criterios King's College para falla hepática no asociada a paracetamol": {
    title: "King's College — falla hepática no paracetamol",
    subtitle: "INR aislado o combinación de factores pronósticos",
    rows: [
      { key: "inr", label: "INR >6,5", options: noYes(10) }, { key: "age", label: "Edad <10 o >40 años", options: noYes() },
      { key: "etiology", label: "Etiología desfavorable (indeterminada, fármaco idiosincrático, Wilson, etc.)", options: noYes() },
      { key: "jaundice", label: "Ictericia >7 días antes de encefalopatía", options: noYes() }, { key: "inr35", label: "INR >3,5", options: noYes() }, { key: "bilirubin", label: "Bilirrubina >300 µmol/L", options: noYes() },
    ],
    interpret: (s) => s >= 10 ? "Cumple por INR >6,5: valoración inmediata por centro de trasplante." : s >= 3 ? `Presenta ${s} factores combinados (umbral ≥3): cumple King's College.` : `${s} factor(es): no cumple el umbral combinado, pero requiere manejo especializado y reevaluación seriada.`,
    source: "O'Grady et al. — criterios King's College",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10836844/",
  },
  "Score Rockall completo": {
    title: "Rockall completo",
    subtitle: "Riesgo tras endoscopia en hemorragia digestiva alta; 0–11 puntos",
    rows: [
      { key: "age", label: "Edad", options: [{ label: "<60", value: 0 }, { label: "60–79", value: 1 }, { label: "≥80", value: 2 }] },
      { key: "shock", label: "Shock", options: [{ label: "Sin shock: PAS ≥100 y pulso <100", value: 0 }, { label: "Taquicardia: PAS ≥100 y pulso ≥100", value: 1 }, { label: "Hipotensión: PAS <100", value: 2 }] },
      { key: "comorbidity", label: "Comorbilidad", options: [{ label: "Ninguna mayor", value: 0 }, { label: "Insuficiencia cardiaca/cardiopatía isquémica u otra mayor", value: 2 }, { label: "Falla renal, hepática o cáncer diseminado", value: 3 }] },
      { key: "diagnosis", label: "Diagnóstico endoscópico", options: [{ label: "Mallory–Weiss o sin lesión/sangrado reciente", value: 0 }, { label: "Otros diagnósticos", value: 1 }, { label: "Neoplasia digestiva alta", value: 2 }] },
      { key: "stigmata", label: "Estigmas de sangrado reciente", options: [{ label: "Ninguno o punto pigmentado oscuro", value: 0 }, { label: "Sangre, coágulo adherido o vaso visible/en sangrado", value: 2 }] },
    ],
    interpret: (s) => s === 0 ? "Rockall 0: grupo de muy bajo riesgo en la cohorte original." : `Rockall ${s}/11: el riesgo de resangrado y muerte aumenta con la puntuación; usar junto con manejo endoscópico y protocolos locales.`,
    source: "Rockall et al. — score original",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/8675081/",
  },
  "Score Rockall para sangrado digestivo alto": {
    title: "Rockall preendoscópico",
    subtitle: "Edad, shock y comorbilidad; 0–7 puntos",
    rows: [
      { key: "age", label: "Edad", options: [{ label: "<60", value: 0 }, { label: "60–79", value: 1 }, { label: "≥80", value: 2 }] },
      { key: "shock", label: "Shock", options: [{ label: "Sin shock", value: 0 }, { label: "Taquicardia sin hipotensión", value: 1 }, { label: "PAS <100", value: 2 }] },
      { key: "comorbidity", label: "Comorbilidad", options: [{ label: "Ninguna mayor", value: 0 }, { label: "Cardiaca u otra mayor", value: 2 }, { label: "Renal, hepática o cáncer diseminado", value: 3 }] },
    ],
    interpret: (s) => `Rockall preendoscópico ${s}/7. No sustituye Glasgow–Blatchford para decisiones iniciales ni el Rockall completo tras endoscopia.`,
    source: "Rockall et al. — score original",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/8675081/",
  },
  "Criterios ACR/EULAR para gota": {
    title: "Clasificación ACR/EULAR 2015 para gota",
    subtitle: "Aplicar tras al menos un episodio de edema, dolor o sensibilidad en articulación periférica/bursa; cristales de urato son criterio suficiente",
    rows: [
      { key: "crystals", label: "Cristales de urato monosódico", options: [{ label: "No demostrados", value: 0 }, { label: "Demostrados (criterio suficiente)", value: 100 }] },
      { key: "pattern", label: "Patrón articular", options: [{ label: "Otro", value: 0 }, { label: "Tobillo/mediopié sin MTF1", value: 1 }, { label: "MTF1", value: 2 }] },
      { key: "episode", label: "Características del episodio", options: [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }] },
      { key: "time", label: "Curso temporal típico", options: [{ label: "Nunca", value: 0 }, { label: "Un episodio", value: 1 }, { label: "Recurrente", value: 2 }] },
      { key: "tophi", label: "Tofo clínico", options: absentPresent(4) },
      { key: "urate", label: "Urato sérico", options: [{ label: "<4 mg/dL", value: -4 }, { label: "4–<6", value: 0 }, { label: "6–<8", value: 2 }, { label: "8–<10", value: 3 }, { label: "≥10", value: 4 }] },
      { key: "fluid", label: "Cristales en líquido de articulación sintomática", options: [{ label: "No evaluado", value: 0 }, { label: "Negativo", value: -2 }] },
      { key: "imaging", label: "Imagen con depósito de urato", options: absentPresent(4) }, { key: "damage", label: "Daño articular relacionado con gota", options: absentPresent(4) },
    ],
    interpret: (s) => s >= 100 ? "Cristales demostrados: criterio suficiente de clasificación." : s >= 8 ? `ACR/EULAR ${s}: cumple clasificación de gota (umbral ≥8).` : `ACR/EULAR ${s}: no alcanza el umbral de clasificación.`,
    source: "Neogi et al. — criterios ACR/EULAR 2015",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/26352873/",
  },
  "Criterios para granulomatosis eosinofílica con poliangeítis": {
    title: "ACR/EULAR 2022 para EGPA",
    subtitle: "Aplicar solo tras establecer vasculitis de vasos pequeños/medianos y excluir imitadores",
    rows: [
      { key: "airway", label: "Enfermedad obstructiva de vía aérea", options: absentPresent(3) }, { key: "polyps", label: "Pólipos nasales", options: absentPresent(3) },
      { key: "neuropathy", label: "Mononeuritis múltiple/neuropatía motora", options: absentPresent(1) }, { key: "eosinophils", label: "Eosinófilos ≥1×10⁹/L", options: absentPresent(5) },
      { key: "biopsy", label: "Inflamación eosinofílica extravascular", options: absentPresent(2) }, { key: "pr3", label: "cANCA/PR3 positivo", options: [{ label: "No", value: 0 }, { label: "Sí", value: -3 }] },
      { key: "hematuria", label: "Hematuria", options: [{ label: "No", value: 0 }, { label: "Sí", value: -1 }] },
    ],
    interpret: (s) => s >= 6 ? `Puntuación ${s}: clasifica como EGPA (umbral ≥6) en la población aplicable.` : `Puntuación ${s}: no alcanza el umbral de clasificación.`,
    source: "Grayson et al. — ACR/EULAR 2022 EGPA",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/35106968/",
  },
  "Arteritis de células gigantes": {
    title: "ACR/EULAR 2022 para arteritis de células gigantes",
    subtitle: "Edad ≥50 años es requisito absoluto; aplicar tras diagnóstico de vasculitis y exclusión de imitadores",
    rows: [
      { key: "age", label: "Edad ≥50 años (obligatorio)", options: noYes(100) }, { key: "biopsy", label: "Biopsia temporal positiva o halo ecográfico", options: absentPresent(5) },
      { key: "inflammation", label: "VSG ≥50 o PCR ≥10 mg/L", options: absentPresent(3) }, { key: "vision", label: "Pérdida visual súbita", options: absentPresent(3) },
      { key: "morning", label: "Rigidez matinal de hombro/cuello", options: absentPresent(2) }, { key: "jaw", label: "Claudicación mandibular/lingual", options: absentPresent(2) },
      { key: "headache", label: "Cefalea temporal nueva", options: absentPresent(2) }, { key: "scalp", label: "Sensibilidad de cuero cabelludo", options: absentPresent(2) },
      { key: "artery", label: "Anormalidad de arteria temporal", options: absentPresent(2) }, { key: "axillary", label: "Afectación axilar bilateral", options: absentPresent(2) }, { key: "aorta", label: "Actividad FDG en aorta", options: absentPresent(2) },
    ],
    interpret: (s) => s < 100 ? "No cumple el requisito absoluto de edad ≥50 años." : s - 100 >= 6 ? `Puntuación ${s - 100}: clasifica como ACG (umbral ≥6).` : `Puntuación ${s - 100}: no alcanza el umbral.`,
    source: "Ponte et al. — ACR/EULAR 2022 GCA",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/36350123/",
  },
  "Granulomatosis con poliangeítis": {
    title: "ACR/EULAR 2022 para GPA",
    subtitle: "Aplicar tras establecer vasculitis y excluir diagnósticos alternativos",
    rows: [
      { key: "nasal", label: "Secreción nasal sanguinolenta/congestión/úlceras", options: absentPresent(3) }, { key: "cartilage", label: "Afectación cartilaginosa", options: absentPresent(2) },
      { key: "hearing", label: "Hipoacusia conductiva/neurosensorial", options: absentPresent(1) }, { key: "pr3", label: "cANCA o anti-PR3", options: absentPresent(5) },
      { key: "lung", label: "Nódulos, masa o cavitación pulmonar", options: absentPresent(2) }, { key: "granuloma", label: "Granuloma/inflamación granulomatosa", options: absentPresent(2) },
      { key: "sinus", label: "Sinusitis/mastoiditis por imagen", options: absentPresent(1) }, { key: "gn", label: "Glomerulonefritis pauciinmune", options: absentPresent(1) },
      { key: "mpo", label: "pANCA o anti-MPO", options: [{ label: "No", value: 0 }, { label: "Sí", value: -1 }] }, { key: "eos", label: "Eosinófilos ≥1×10⁹/L", options: [{ label: "No", value: 0 }, { label: "Sí", value: -4 }] },
    ],
    interpret: (s) => s >= 5 ? `Puntuación ${s}: clasifica como GPA (umbral ≥5).` : `Puntuación ${s}: no alcanza el umbral de clasificación.`,
    source: "Robson et al. — ACR/EULAR 2022 GPA",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/35110333/",
  },
  "Score SILC para carditis de Lyme": {
    title: "Suspicious Index in Lyme Carditis (SILC)",
    subtitle: "En bloqueo AV de alto grado sin causa clara; herramienta propuesta, no validada prospectivamente",
    rows: [
      { key: "age", label: "Edad <50 años", options: noYes(1) }, { key: "male", label: "Sexo masculino", options: noYes(1) },
      { key: "outdoor", label: "Actividad exterior/área endémica", options: noYes(1) }, { key: "constitutional", label: "Síntomas constitucionales", options: noYes(2) },
      { key: "tick", label: "Antecedente de picadura de garrapata", options: noYes(3) }, { key: "erythema", label: "Eritema migrans", options: noYes(4) },
    ],
    interpret: (s) => s <= 2 ? `SILC ${s}: baja sospecha.` : s <= 6 ? `SILC ${s}: sospecha intermedia; solicitar serología y manejar el bloqueo según estabilidad.` : `SILC ${s}: alta sospecha; serología y tratamiento/monitorización urgente según guías.`,
    source: "Besant et al. — SILC",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6489885/",
  },
  "Score pediátrico de asma (PAS)": {
    title: "Pediatric Asthma Score (PAS)",
    subtitle: "Cinco dominios, 5–15 puntos; edades 2–18 años",
    rows: [
      { key: "rr", label: "Frecuencia respiratoria ajustada por edad", options: [{ label: "Leve", value: 1 }, { label: "Moderada", value: 2 }, { label: "Grave", value: 3 }] },
      { key: "oxygen", label: "Oxígeno/SpO₂", options: [{ label: ">95% aire ambiente", value: 1 }, { label: "90–95% aire ambiente", value: 2 }, { label: "<90% o requiere O₂", value: 3 }] },
      { key: "auscultation", label: "Auscultación", options: [{ label: "Normal o sibilancia al final de espiración", value: 1 }, { label: "Sibilancia espiratoria", value: 2 }, { label: "Inspiratoria+espiratoria o murmullo disminuido", value: 3 }] },
      { key: "retractions", label: "Retracciones", options: [{ label: "Ninguna/intercostal", value: 1 }, { label: "Intercostal y subesternal", value: 2 }, { label: "Añade supraclavicular", value: 3 }] },
      { key: "dyspnea", label: "Disnea", options: [{ label: "Habla/juega/come normal", value: 1 }, { label: "Frases cortas o actividad limitada", value: 2 }, { label: "Palabras, no come/juega o agitación/somnolencia", value: 3 }] },
    ],
    interpret: (s) => s <= 7 ? `PAS ${s}: leve.` : s <= 11 ? `PAS ${s}: moderada.` : `PAS ${s}: grave; tratamiento y monitorización urgentes.`,
    source: "Kelly et al.; revisión de escalas pediátricas de asma",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7771822/",
  },
};

export const extendedReferences: Record<string, ReferenceDefinition> = {
  "Subclases de inmunoglobulina IgG": {
    title: "Subclases IgG",
    subtitle: "Interpretar exclusivamente con intervalos por edad y método del laboratorio",
    columns: ["Subclase", "Proporción aproximada en adulto", "Función/observación"],
    rows: [["IgG1", "60–70%", "Respuesta a proteínas"], ["IgG2", "20–30%", "Respuesta a polisacáridos"], ["IgG3", "5–8%", "Respuesta antiviral/proteica"], ["IgG4", "1–4%", "Interpretación clínica específica"]],
    notes: ["Los valores cambian marcadamente con la edad.", "Una subclase baja aislada no diagnostica inmunodeficiencia: correlacionar con infecciones y respuesta a vacunas."],
    source: "International Union of Immunological Societies / ARUP Consult — inmunodeficiencias humorales",
    sourceUrl: "https://arupconsult.com/content/primary-immunodeficiency-diseases",
  },
  "Valores de referencia del complemento": {
    title: "Complemento sérico",
    subtitle: "Rangos orientativos adultos; usar siempre el intervalo del laboratorio",
    columns: ["Prueba", "Rango orientativo", "Interpretación"],
    rows: [["C3", "90–180 mg/dL", "Bajo en consumo de vía clásica/alternativa"], ["C4", "10–40 mg/dL", "Bajo en consumo de vía clásica"], ["CH50", "Método-dependiente", "Cribado de vía clásica"], ["AH50", "Método-dependiente", "Cribado de vía alternativa"]],
    notes: ["Valores normales no excluyen alteraciones parciales.", "Repetir muestras y correlacionar con actividad clínica; manejo preanalítico es crítico."],
    source: "ARUP Consult — Complement Testing",
    sourceUrl: "https://arupconsult.com/content/complement-deficiency",
  },
  "Escala de heces de Bristol": {
    title: "Escala de heces de Bristol",
    subtitle: "Clasificación visual de consistencia fecal, tipos 1–7",
    columns: ["Tipo", "Descripción", "Interpretación habitual"],
    rows: [["1", "Bolas duras separadas", "Tránsito lento/estreñimiento"], ["2", "Forma de salchicha grumosa", "Estreñimiento"], ["3", "Salchicha con grietas", "Habitualmente normal"], ["4", "Lisa, blanda, forma de serpiente", "Habitualmente normal"], ["5", "Fragmentos blandos bien definidos", "Tránsito algo rápido"], ["6", "Fragmentos esponjosos/pastosos", "Diarrea"], ["7", "Acuosa, sin sólidos", "Diarrea" ]],
    notes: ["Describe forma, no etiología.", "En niños pequeños puede usarse la versión modificada pediátrica."],
    source: "Lewis & Heaton — Bristol Stool Form Scale",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/9299672/",
  },
  "Valores normales de fosfatasa alcalina": {
    title: "Fosfatasa alcalina",
    subtitle: "No existe un único rango pediátrico: cambia con crecimiento, sexo, método y laboratorio",
    columns: ["Población", "Patrón esperado", "Acción"],
    rows: [["Adulto", "Rango del laboratorio", "Correlacionar con GGT/isoenzimas"], ["Niñez y pubertad", "Puede ser varias veces mayor por crecimiento óseo", "Usar rango por edad/sexo"], ["Embarazo", "Puede elevarse por fracción placentaria", "Interpretar contexto"]],
    notes: ["No aplicar un rango adulto a un niño.", "La GGT ayuda a orientar origen hepatobiliar frente a óseo."],
    source: "Mayo Clinic Laboratories — Alkaline Phosphatase, Serum",
    sourceUrl: "https://pediatric.testcatalog.org/show/ALP",
  },
  "Valores normales de alfafetoproteína": {
    title: "Alfafetoproteína (AFP)",
    subtitle: "Marcador fuertemente dependiente de edad en lactantes",
    columns: ["Etapa", "Patrón", "Interpretación"],
    rows: [["Recién nacido", "Fisiológicamente muy alta", "Desciende rápidamente"], ["Primer año", "Descenso progresivo", "Usar curva por edad"], [">1–2 años/adulto", "Generalmente baja; rango del laboratorio", "Correlacionar con indicación clínica"]],
    notes: ["Nunca interpretar AFP neonatal con un límite adulto.", "La tendencia y la edad exacta son esenciales en hepatoblastoma/tumores germinales."],
    source: "Mayo Clinic Laboratories — AFP Pediatric Catalog",
    sourceUrl: "https://pediatric.testcatalog.org/show/AFP",
  },
  "Valores de ácidos biliares primarios y totales": {
    title: "Ácidos biliares séricos",
    subtitle: "La referencia depende de ayuno, ensayo y fracción medida",
    columns: ["Prueba", "Muestra", "Uso"],
    rows: [["Ácidos biliares totales", "Ayuno o posprandial según laboratorio", "Colestasis y función hepatobiliar"], ["Ácido cólico/quenodesoxicólico", "Perfil fraccionado", "Defectos de síntesis/metabolismo"], ["Embarazo", "Umbrales obstétricos específicos", "Colestasis intrahepática del embarazo"]],
    notes: ["Use el intervalo y umbral de la guía aplicable.", "Medicamentos y estado posprandial pueden modificar resultados."],
    source: "Mayo Clinic Laboratories — Bile Acids",
    sourceUrl: "https://www.mayocliniclabs.com/test-catalog/Overview/82419",
  },
  "Anticuerpos y enfermedades asociadas": {
    title: "Autoanticuerpos: asociaciones clínicas principales",
    subtitle: "Una prueba aislada no establece diagnóstico",
    columns: ["Anticuerpo", "Asociación principal", "Nota"],
    rows: [["ANA", "LES y otras conectivopatías", "Alta sensibilidad, baja especificidad"], ["anti-dsDNA", "LES", "Puede asociarse con nefritis/actividad"], ["anti-Sm", "LES", "Alta especificidad"], ["anti-CCP", "Artritis reumatoide", "Alta especificidad"], ["PR3-ANCA", "GPA", "Interpretar con fenotipo"], ["MPO-ANCA", "MPA/EGPA", "Interpretar con fenotipo"], ["anti-Ro/SSA", "Sjögren/LES", "Relevante en embarazo"], ["anti-Scl-70", "Esclerosis sistémica difusa", "Asociación con EPI"]],
    notes: ["Solicitar pruebas guiadas por probabilidad pretest.", "Confirmar método, título y patrón cuando corresponda."],
    source: "American College of Rheumatology — patient/clinician resources",
    sourceUrl: "https://rheumatology.org/patients/antinuclear-antibodies-ana",
  },
};

Object.assign(extendedCalculators, {
  "Recuento leucocitario": {
    title: "Interpretación del recuento leucocitario por edad",
    subtitle: "Clasifica el resultado frente a intervalos pediátricos orientativos; prevalece el intervalo del laboratorio",
    fields: [select("Edad", "age", [["0–14 días", "newborn"], ["15 días–2 años", "infant"], ["2–5 años", "preschool"], ["6–11 años", "child"], ["12–17 años", "teen"], ["Adulto", "adult"]]), num("Leucocitos", "wbc", "×10³/µL", "8.5", { min: 0 })],
    calculate: (v: Record<string, string>) => {
      const ranges: Record<string, [number, number]> = { newborn: [9, 30], infant: [6, 17.5], preschool: [5.5, 15.5], child: [4.5, 13.5], teen: [4.5, 13], adult: [4, 11] };
      const [low, high] = ranges[v.age], value = n(v, "wbc");
      return { value: value < low ? "Leucopenia" : value > high ? "Leucocitosis" : "En rango orientativo", interpretation: `Referencia usada: ${low}–${high} ×10³/µL. Confirma rango local, diferencial, tendencia, fármacos y contexto infeccioso/hematológico.` };
    },
    formula: "comparación con intervalo por edad",
    source: "University of Iowa — Pediatric Reference Ranges",
    sourceUrl: "https://www.healthcare.uiowa.edu/path_handbook/appendix/heme/pediatric_normals.html",
  },
  "Surfactante porcino natural": {
    title: "Calculadora de volumen de surfactante prescrito",
    subtitle: "Convierte una dosis ya seleccionada en mg/kg a volumen; confirma producto, indicación y redosificación",
    fields: [num("Peso", "weight", "kg", "1.2", { min: 0.3, max: 10 }), num("Dosis prescrita", "dose", "mg/kg", "200", { min: 1 }), num("Concentración del producto", "concentration", "mg/mL", "80", { min: 1 })],
    calculate: (v: Record<string, string>) => { const mg = n(v, "weight") * n(v, "dose"); return { value: (mg / n(v, "concentration")).toFixed(2), unit: "mL", interpretation: `${mg.toFixed(1)} mg totales. Verifica que la dosis corresponda exactamente al surfactante comercial, la edad gestacional, estrategia LISA/INSURE y ficha técnica local.` }; },
    formula: "mL = peso × mg/kg ÷ mg/mL",
    source: "European Consensus Guidelines on RDS 2022",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10064400/",
  },
  "Nomograma de fototerapia": {
    title: "Comparación con umbral AAP 2022",
    subtitle: "Para recién nacidos ≥35 semanas: usa el umbral exacto obtenido de la figura AAP correspondiente a edad, gestación y neurotoxicidad",
    fields: [num("Bilirrubina total", "bilirubin", "mg/dL", "15", { min: 0 }), num("Umbral AAP aplicable", "threshold", "mg/dL", "17", { min: 0.1 })],
    calculate: (v: Record<string, string>) => { const delta = n(v, "bilirubin") - n(v, "threshold"); return { value: delta >= 0 ? "En/sobre umbral" : "Bajo umbral", unit: `${Math.abs(delta).toFixed(1)} mg/dL ${delta >= 0 ? "sobre" : "bajo"}`, interpretation: "El umbral debe seleccionarse según edad en horas, edad gestacional y factores de neurotoxicidad. Una bilirrubina en/sobre el umbral requiere actuación conforme a la guía; evaluar también escalada de cuidados y recambio." }; },
    formula: "diferencia = bilirrubina medida − umbral AAP 2022 aplicable",
    source: "AAP — Clinical Practice Guideline: Hyperbilirubinemia 2022",
    sourceUrl: "https://publications.aap.org/pediatrics/article/150/3/e2022058859/188726/Clinical-Practice-Guideline-Revision-Management",
  },
  "Nomograma de riesgo de hiperbilirrubinemia": {
    title: "Seguimiento posalta por diferencia al umbral de fototerapia",
    subtitle: "AAP 2022 reemplaza las zonas de riesgo antiguas por la distancia al umbral aplicable",
    fields: [num("Bilirrubina total", "bilirubin", "mg/dL", "12", { min: 0 }), num("Umbral de fototerapia aplicable", "threshold", "mg/dL", "17", { min: 0.1 })],
    calculate: (v: Record<string, string>) => {
      const delta = n(v, "threshold") - n(v, "bilirubin");
      const plan = delta < 0 ? "Supera el umbral: tratar según guía" : delta < 2 ? "Muy próxima: repetir en 4–24 h / considerar fototerapia según contexto" : delta < 3.5 ? "Repetir en 4–24 h" : delta < 5.5 ? "Repetir en 1–2 días" : delta < 7 ? "Seguimiento en 2 días" : "Seguimiento clínico según edad y contexto";
      return { value: delta.toFixed(1), unit: "mg/dL bajo el umbral", interpretation: plan + ". Ajusta por edad posnatal, alta, lactancia, trayectoria, hemólisis y neurotoxicidad." };
    },
    formula: "Δ-TSB = umbral de fototerapia − bilirrubina",
    source: "AAP — Hyperbilirubinemia Guideline 2022",
    sourceUrl: "https://publications.aap.org/pediatrics/article/150/3/e2022058859/188726/Clinical-Practice-Guideline-Revision-Management",
  },
  "Valores predichos de FEV1": {
    title: "FEV₁ como porcentaje del valor predicho/LLN",
    subtitle: "Usa valores predichos y límite inferior de normalidad calculados con GLI para edad, talla, sexo y grupo de referencia",
    fields: [num("FEV₁ medido", "measured", "L", "2.4", { min: 0 }), num("FEV₁ predicho GLI", "predicted", "L", "2.8", { min: 0.01 }), num("Límite inferior de normalidad", "lln", "L", "2.25", { min: 0 })],
    calculate: (v: Record<string, string>) => { const pct = n(v, "measured") / n(v, "predicted") * 100; return { value: pct.toFixed(1), unit: "% predicho", interpretation: `${n(v, "measured") < n(v, "lln") ? "Bajo el LLN" : "No bajo el LLN"}. Para diagnóstico usa z-score/LLN, calidad de maniobras, FEV₁/FVC y respuesta broncodilatadora; % predicho aislado no define obstrucción.` }; },
    formula: "% predicho = medido ÷ predicho ×100",
    source: "Global Lung Function Initiative — GLI reference equations",
    sourceUrl: "https://www.ers-education.org/guidelines/global-lung-function-initiative/",
  },
  "Predicción PEFR/FVC/FEF50/FEF75": {
    title: "Comparador de función pulmonar con predicho GLI",
    subtitle: "Calcula porcentaje predicho de cualquier parámetro; la interpretación principal debe usar z-score/LLN",
    fields: [select("Parámetro", "parameter", [["PEF", "PEF"], ["FVC", "FVC"], ["FEF50", "FEF50"], ["FEF75", "FEF75"]]), num("Medido", "measured", "misma unidad", "3.2", { min: 0 }), num("Predicho GLI", "predicted", "misma unidad", "4.0", { min: 0.01 }), num("LLN GLI", "lln", "misma unidad", "3.1", { min: 0 })],
    calculate: (v: Record<string, string>) => { const pct = n(v, "measured") / n(v, "predicted") * 100; return { value: pct.toFixed(1), unit: "% predicho", interpretation: `${v.parameter}: ${n(v, "measured") < n(v, "lln") ? "bajo el LLN" : "en/sobre LLN"}. Los flujos medios son variables y no deben diagnosticar enfermedad de vía pequeña de forma aislada.` }; },
    formula: "% predicho = medido ÷ predicho ×100",
    source: "ERS/GLI — ecuaciones de referencia pulmonares",
    sourceUrl: "https://www.ers-education.org/guidelines/global-lung-function-initiative/",
  },
  "Algoritmo de interpretación de espirometría": categorical(
    "Algoritmo ATS/ERS de espirometría",
    "Usa LLN o z-score, no un cociente fijo, y exige calidad técnica aceptable",
    [select("Calidad de la prueba", "quality", [["Aceptable y reproducible", "good"], ["No aceptable/no reproducible", "bad"]]), select("FEV₁/FVC", "ratio", [["≥LLN", "normal"], ["<LLN", "low"]]), select("FVC", "fvc", [["≥LLN", "normal"], ["<LLN", "low"]]), select("TLC si está disponible", "tlc", [["No medida", "unknown"], ["≥LLN", "normal"], ["<LLN", "low"]]), select("Respuesta broncodilatadora", "bd", [["No significativa/no medida", "no"], ["Significativa según ATS/ERS", "yes"]])],
    (v: Record<string, string>) => {
      if (v.quality === "bad") return { value: "No interpretable", interpretation: "Repetir con criterios de aceptabilidad y reproducibilidad." };
      let pattern = "Espirometría dentro de límites";
      if (v.ratio === "low" && v.fvc === "normal") pattern = "Patrón obstructivo";
      if (v.ratio === "low" && v.fvc === "low") pattern = v.tlc === "low" ? "Patrón mixto confirmado" : "Obstrucción con FVC baja; medir TLC";
      if (v.ratio === "normal" && v.fvc === "low") pattern = v.tlc === "low" ? "Restricción confirmada" : "Posible restricción/patrón inespecífico; medir TLC";
      return { value: pattern, interpretation: `${v.bd === "yes" ? "Respuesta broncodilatadora significativa. " : ""}Correlaciona con síntomas, curvas, volúmenes y difusión.` };
    },
    "ERS/ATS Technical Standard on Interpretive Strategies for Routine Lung Function Tests 2022",
    "https://pubmed.ncbi.nlm.nih.gov/34949706/"
  ),
});

const leipzigScore: ScoreDefinition = {
  title: "Score de Leipzig para enfermedad de Wilson",
  subtitle: "Integra hallazgos clínicos, bioquímicos, hepáticos y genéticos; seleccione solo una opción por dominio",
  rows: [
    { key: "kf", label: "Anillos de Kayser–Fleischer", options: [{ label: "Ausentes", value: 0 }, { label: "Presentes", value: 2 }] },
    { key: "neuro", label: "Síntomas neurológicos o RM cerebral típica", options: [{ label: "Ausentes", value: 0 }, { label: "Leves/posibles", value: 1 }, { label: "Típicos", value: 2 }] },
    { key: "cerulo", label: "Ceruloplasmina", options: [{ label: ">0,20 g/L", value: 0 }, { label: "0,10–0,20 g/L", value: 1 }, { label: "<0,10 g/L", value: 2 }] },
    { key: "hemolysis", label: "Anemia hemolítica Coombs negativa", options: [{ label: "Ausente", value: 0 }, { label: "Presente", value: 1 }] },
    { key: "liver", label: "Cobre hepático (si se midió)", options: [{ label: "Normal (<0,8×LSN)", value: -1 }, { label: "No realizado/no concluyente", value: 0 }, { label: "0,8–4×LSN o tinción positiva", value: 1 }, { label: ">4×LSN", value: 2 }] },
    { key: "urine", label: "Cobre urinario de 24 h", options: [{ label: "Normal", value: 0 }, { label: "1–2×LSN", value: 1 }, { label: ">2×LSN o prueba de penicilamina positiva", value: 2 }] },
    { key: "genetics", label: "Mutaciones ATP7B", options: [{ label: "Ninguna detectada", value: 0 }, { label: "Una mutación", value: 1 }, { label: "Dos mutaciones en cromosomas distintos", value: 4 }] },
  ],
  interpret: (score) => score >= 4 ? `${score} puntos: diagnóstico establecido según Leipzig.` : score === 3 ? "3 puntos: diagnóstico posible; se requieren más pruebas." : `${score} puntos: diagnóstico improbable por el score, sin excluirlo si la sospecha clínica es alta.`,
  source: "EASL Clinical Practice Guidelines — Wilson disease",
  sourceUrl: "https://www.journal-of-hepatology.eu/article/S0168-8278(24)02706-5/fulltext",
};

Object.assign(extendedScores, {
  "Criterios de Manning para síndrome de intestino irritable": {
    title: "Criterios de Manning para síndrome de intestino irritable",
    subtitle: "Conjunto histórico de síntomas; actualmente se prefieren criterios Roma con evaluación de signos de alarma",
    rows: [
      { key: "relief", label: "Dolor que mejora con la defecación", options: noYes() },
      { key: "frequency", label: "Deposiciones más frecuentes al comenzar el dolor", options: noYes() },
      { key: "loose", label: "Deposiciones más blandas al comenzar el dolor", options: noYes() },
      { key: "distension", label: "Distensión abdominal visible", options: noYes() },
      { key: "mucus", label: "Moco por recto", options: noYes() },
      { key: "incomplete", label: "Sensación de evacuación incompleta", options: noYes() },
    ],
    interpret: (score) => `${score}/6 criterios. Más criterios aumentan la compatibilidad histórica, pero Manning no establece un umbral diagnóstico universal ni excluye enfermedad orgánica; use Roma IV y signos de alarma.`,
    source: "Manning et al. — Towards positive diagnosis of the irritable bowel",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/698649/",
  },
  "Índice de actividad de Crohn pediátrico": {
    title: "Pediatric Crohn's Disease Activity Index (PCDAI)",
    subtitle: "Puntuación clínica y de laboratorio para actividad de enfermedad de Crohn pediátrica",
    rows: [
      { key: "pain", label: "Dolor abdominal", options: [{ label: "Ninguno", value: 0 }, { label: "Leve", value: 5 }, { label: "Moderado/grave", value: 10 }] },
      { key: "stools", label: "Deposiciones líquidas/día", options: [{ label: "0–1", value: 0 }, { label: "Hasta 5", value: 5 }, { label: ">5 o sangre franca", value: 10 }] },
      { key: "wellbeing", label: "Bienestar general", options: [{ label: "Bueno", value: 0 }, { label: "Dificultad ocasional", value: 5 }, { label: "Malo/muy limitado", value: 10 }] },
      { key: "weight", label: "Peso", options: [{ label: "Ganancia o estable", value: 0 }, { label: "Pérdida 1–9%", value: 5 }, { label: "Pérdida ≥10%", value: 10 }] },
      { key: "height", label: "Velocidad de talla", options: [{ label: ">−1 DE", value: 0 }, { label: "−1 a −2 DE", value: 5 }, { label: "<−2 DE", value: 10 }] },
      { key: "abdomen", label: "Exploración abdominal", options: [{ label: "Sin dolor/masa", value: 0 }, { label: "Dolor o masa sin dolor", value: 5 }, { label: "Dolor/defensa o masa dolorosa", value: 10 }] },
      { key: "perirectal", label: "Enfermedad perirrectal", options: [{ label: "Ninguna/asintomática", value: 0 }, { label: "1–2 fístulas indoloras o escasa supuración", value: 5 }, { label: "Enfermedad activa, absceso o dolor", value: 10 }] },
      { key: "extra", label: "Manifestaciones extraintestinales", options: [{ label: "Ninguna", value: 0 }, { label: "Una", value: 5 }, { label: "Dos o más", value: 10 }] },
      { key: "hematocrit", label: "Hematocrito según edad/sexo", options: [{ label: "Normal", value: 0 }, { label: "Levemente bajo", value: 2.5 }, { label: "Marcadamente bajo", value: 5 }] },
      { key: "esr", label: "VSG", options: [{ label: "<20 mm/h", value: 0 }, { label: "20–50", value: 2.5 }, { label: ">50", value: 5 }] },
      { key: "albumin", label: "Albúmina", options: [{ label: "≥3,5 g/dL", value: 0 }, { label: "3,1–3,4", value: 5 }, { label: "≤3,0", value: 10 }] },
    ],
    interpret: (score) => score < 10 ? `${score}: remisión/inactiva.` : score < 30 ? `${score}: actividad leve.` : score < 40 ? `${score}: actividad moderada.` : `${score}: actividad grave.`,
    source: "Hyams et al. — Development and validation of PCDAI",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/1678008/",
  },
  "Score histológico NAFLD pediátrico": {
    title: "NAFLD Activity Score (NAS)",
    subtitle: "Puntuación histológica: esteatosis + inflamación lobulillar + balonización; no diagnostica NASH de forma aislada",
    rows: [
      { key: "steatosis", label: "Esteatosis", options: [{ label: "<5%", value: 0 }, { label: "5–33%", value: 1 }, { label: ">33–66%", value: 2 }, { label: ">66%", value: 3 }] },
      { key: "inflammation", label: "Inflamación lobulillar por campo 200×", options: [{ label: "Ninguna", value: 0 }, { label: "<2 focos", value: 1 }, { label: "2–4 focos", value: 2 }, { label: ">4 focos", value: 3 }] },
      { key: "ballooning", label: "Balonización hepatocelular", options: [{ label: "Ninguna", value: 0 }, { label: "Pocas células", value: 1 }, { label: "Muchas/prominente", value: 2 }] },
    ],
    interpret: (score) => `${score}/8 NAS. El diagnóstico de esteatohepatitis es un patrón histológico y no debe reducirse al total; registre fibrosis por separado.`,
    source: "Kleiner et al. — NASH Clinical Research Network scoring system",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/15915461/",
  },
  "Score Leipzig modificado": leipzigScore,
  "Score Leipzig para enfermedad de Wilson": leipzigScore,
  "Reflux Finding Score": {
    title: "Reflux Finding Score (RFS)",
    subtitle: "Hallazgos laringoscópicos descritos en la escala original; su especificidad es limitada",
    rows: [
      { key: "subglottic", label: "Edema subglótico", options: [{ label: "Ausente", value: 0 }, { label: "Presente", value: 2 }] },
      { key: "ventricular", label: "Obliteración ventricular", options: [{ label: "Ninguna", value: 0 }, { label: "Parcial", value: 2 }, { label: "Completa", value: 4 }] },
      { key: "erythema", label: "Eritema/hiperemia", options: [{ label: "Ninguno", value: 0 }, { label: "Solo aritenoides", value: 2 }, { label: "Difuso", value: 4 }] },
      { key: "vocal", label: "Edema de cuerdas vocales", options: [{ label: "Ninguno", value: 0 }, { label: "Leve", value: 1 }, { label: "Moderado", value: 2 }, { label: "Grave", value: 3 }, { label: "Polipoide", value: 4 }] },
      { key: "laryngeal", label: "Edema laríngeo difuso", options: [{ label: "Ninguno", value: 0 }, { label: "Leve", value: 1 }, { label: "Moderado", value: 2 }, { label: "Grave", value: 3 }, { label: "Obstructivo", value: 4 }] },
      { key: "posterior", label: "Hipertrofia de comisura posterior", options: [{ label: "Ninguna", value: 0 }, { label: "Leve", value: 1 }, { label: "Moderada", value: 2 }, { label: "Grave", value: 3 }, { label: "Obstructiva", value: 4 }] },
      { key: "granuloma", label: "Granuloma/tejido de granulación", options: [{ label: "Ausente", value: 0 }, { label: "Presente", value: 2 }] },
      { key: "mucus", label: "Moco endolaríngeo espeso", options: [{ label: "Ausente", value: 0 }, { label: "Presente", value: 2 }] },
    ],
    interpret: (score) => `${score}/26. ${score > 7 ? "Supera el punto de corte original >7" : "No supera el punto de corte original"}; no confirma reflujo laringofaríngeo y debe interpretarse con evaluación ORL y diagnósticos alternativos.`,
    source: "Belafsky et al. — Validity and reliability of the Reflux Finding Score",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/11568561/",
  },
  "Índice de actividad de rechazo": {
    title: "Banff Rejection Activity Index hepático",
    subtitle: "Puntuación histológica de rechazo celular agudo en biopsia de injerto hepático",
    rows: [
      { key: "portal", label: "Inflamación portal", options: [{ label: "Ausente", value: 0 }, { label: "Leve", value: 1 }, { label: "Moderada", value: 2 }, { label: "Marcada", value: 3 }] },
      { key: "duct", label: "Inflamación/daño de conductos biliares", options: [{ label: "Ausente", value: 0 }, { label: "Leve", value: 1 }, { label: "Moderado", value: 2 }, { label: "Marcado", value: 3 }] },
      { key: "venous", label: "Inflamación endotelial venosa", options: [{ label: "Ausente", value: 0 }, { label: "Leve", value: 1 }, { label: "Moderada", value: 2 }, { label: "Marcada", value: 3 }] },
    ],
    interpret: (score) => `${score}/9 RAI. La categoría final Banff requiere patrón global, adecuación de biopsia, contexto temporal y exclusión de infección, lesión biliar, isquemia y toxicidad.`,
    source: "Banff Working Group — international consensus document for liver allograft rejection",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/9404965/",
  },
  "Severidad de pancreatitis aguda": {
    title: "BISAP para pancreatitis aguda",
    subtitle: "Predicción temprana de mortalidad en adultos durante las primeras 24 horas",
    rows: [
      { key: "bun", label: "BUN >25 mg/dL", options: noYes() },
      { key: "mental", label: "Alteración del estado mental (GCS <15)", options: noYes() },
      { key: "sirs", label: "SIRS presente", options: noYes() },
      { key: "age", label: "Edad >60 años", options: noYes() },
      { key: "effusion", label: "Derrame pleural", options: noYes() },
    ],
    interpret: (score) => `${score}/5 BISAP. ${score >= 3 ? "Mayor riesgo de pancreatitis grave y mortalidad; monitorización intensiva según evolución." : "Riesgo menor en la cohorte original, sin excluir deterioro."} No aplicar como score pediátrico.`,
    source: "Wu et al. — BISAP derivation and validation",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18519429/",
  },
  "Índice de Wilson para mortalidad": {
    title: "New Wilson Index",
    subtitle: "Pronóstico de muerte sin trasplante en falla hepática por enfermedad de Wilson",
    rows: [
      { key: "bilirubin", label: "Bilirrubina total (mg/dL)", options: [{ label: "0–5,8", value: 0 }, { label: "5,9–8,7", value: 1 }, { label: "8,8–11,7", value: 2 }, { label: "11,8–17,5", value: 3 }, { label: ">17,5", value: 4 }] },
      { key: "inr", label: "INR", options: [{ label: "≤1,29", value: 0 }, { label: "1,3–1,6", value: 1 }, { label: "1,7–1,9", value: 2 }, { label: "2,0–2,4", value: 3 }, { label: "≥2,5", value: 4 }] },
      { key: "ast", label: "AST (U/L)", options: [{ label: "≤100", value: 0 }, { label: "101–150", value: 1 }, { label: "151–200", value: 2 }, { label: "201–300", value: 3 }, { label: ">300", value: 4 }] },
      { key: "wbc", label: "Leucocitos (×10⁹/L)", options: [{ label: "≤6,7", value: 0 }, { label: "6,8–8,3", value: 1 }, { label: "8,4–10,3", value: 2 }, { label: "10,4–15,3", value: 3 }, { label: "≥15,4", value: 4 }] },
      { key: "albumin", label: "Albúmina (g/dL)", options: [{ label: ">4,5", value: 0 }, { label: "3,4–4,4", value: 1 }, { label: "2,5–3,3", value: 2 }, { label: "2,1–2,4", value: 3 }, { label: "≤2,0", value: 4 }] },
    ],
    interpret: (score) => score >= 11 ? `${score}/20: alta probabilidad de muerte sin trasplante; derivación inmediata a centro de trasplante.` : `${score}/20: por debajo de 11, pero la falla hepática por Wilson sigue siendo una emergencia y requiere centro experto.`,
    source: "Dhawan et al.; AASLD Practice Guidance on Wilson disease",
    sourceUrl: "https://onlinelibrary.wiley.com/doi/10.1002/hep.32805",
  },
  "Espondilitis anquilosante": {
    title: "Criterios ASAS para espondiloartritis axial",
    subtitle: "Clasificación en pacientes con dolor lumbar ≥3 meses e inicio antes de 45 años",
    rows: [
      { key: "entry", label: "Cumple entrada: dolor ≥3 meses e inicio <45 años", options: noYes(10) },
      { key: "imaging", label: "Sacroileítis en imagen", options: noYes(3) },
      { key: "hla", label: "HLA-B27 positivo", options: noYes(2) },
      { key: "features", label: "Número de características SpA adicionales", options: [{ label: "Ninguna", value: 0 }, { label: "Una", value: 1 }, { label: "Dos o más", value: 2 }] },
    ],
    interpret: (score) => {
      const entry = score >= 10;
      const body = score - (entry ? 10 : 0);
      const imagingArm = (body >= 4 || body === 3 || body === 5); // imaging + ≥1 feature; sum representation is explained below.
      const hlaArm = body >= 4;
      return !entry ? "No cumple los criterios de entrada ASAS." : imagingArm || hlaArm ? "Compatible con una rama ASAS; confirme que sea imagen + ≥1 característica o HLA-B27 + ≥2 características." : "No alcanza una rama ASAS.";
    },
    source: "Rudwaleit et al. — ASAS classification criteria for axial spondyloarthritis",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/19297344/",
  },
  "Esclerodermia": {
    title: "Criterios ACR/EULAR 2013 para esclerosis sistémica",
    subtitle: "Clasificación; cuente solo la mayor puntuación de cada dominio",
    rows: [
      { key: "proximal", label: "Engrosamiento cutáneo proximal a MCP (criterio suficiente)", options: [{ label: "No", value: 0 }, { label: "Sí", value: 20 }] },
      { key: "fingers", label: "Dedos", options: [{ label: "Ninguno", value: 0 }, { label: "Dedos tumefactos", value: 2 }, { label: "Esclerodactilia", value: 4 }] },
      { key: "tips", label: "Lesiones de puntas digitales", options: [{ label: "Ninguna", value: 0 }, { label: "Úlceras", value: 2 }, { label: "Cicatrices puntiformes", value: 3 }] },
      { key: "telangiectasia", label: "Telangiectasias", options: absentPresent(2) },
      { key: "nailfold", label: "Capilares periungueales anormales", options: absentPresent(2) },
      { key: "lung", label: "Hipertensión arterial pulmonar o enfermedad intersticial", options: absentPresent(2) },
      { key: "raynaud", label: "Fenómeno de Raynaud", options: absentPresent(3) },
      { key: "antibodies", label: "Anticentrómero, anti-topoisomerasa I o anti-RNA polimerasa III", options: absentPresent(3) },
    ],
    interpret: (score) => score >= 20 ? "Criterio suficiente: clasifica como esclerosis sistémica." : score >= 9 ? `${score} puntos: clasifica como esclerosis sistémica.` : `${score} puntos: no alcanza el umbral de 9.`,
    source: "van den Hoogen et al. — 2013 ACR/EULAR systemic sclerosis criteria",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/24122180/",
  },
  "Síndrome de Sjögren": {
    title: "Criterios ACR/EULAR 2016 para síndrome de Sjögren primario",
    subtitle: "Clasificación en pacientes con signos/síntomas sugestivos y sin exclusiones",
    rows: [
      { key: "biopsy", label: "Biopsia salival: sialadenitis focal y focus score ≥1", options: noYes(3) },
      { key: "ssa", label: "Anti-SSA/Ro positivo", options: noYes(3) },
      { key: "ocular", label: "Ocular staining score ≥5 o van Bijsterveld ≥4", options: noYes() },
      { key: "schirmer", label: "Schirmer ≤5 mm/5 min", options: noYes() },
      { key: "saliva", label: "Flujo salival no estimulado ≤0,1 mL/min", options: noYes() },
    ],
    interpret: (score) => score >= 4 ? `${score} puntos: cumple clasificación ACR/EULAR si es elegible y no presenta exclusiones.` : `${score} puntos: no alcanza el umbral de 4.`,
    source: "Shiboski et al. — 2016 ACR/EULAR Sjögren classification criteria",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/27789466/",
  },
});

Object.assign(extendedReferences, {
  "Resistencia intrínseca a fármacos": {
    title: "Resistencia antimicrobiana intrínseca esperada",
    subtitle: "Ejemplos de fenotipos que deben verificarse con reglas EUCAST vigentes y microbiología local",
    columns: ["Microorganismo/grupo", "Resistencia intrínseca o esperada", "Implicación"],
    rows: [
      ["Enterococcus spp.", "Cefalosporinas; bajo nivel de aminoglucósidos", "No informar como opción activa aun con halo aparente"],
      ["Listeria monocytogenes", "Cefalosporinas", "La cefalosporina no cubre listeriosis"],
      ["Pseudomonas aeruginosa", "Ampicilina/amoxicilina, cefalosporinas tempranas, ertapenem", "Usar agentes antipseudomónicos según antibiograma"],
      ["Stenotrophomonas maltophilia", "Carbapenémicos", "Mecanismos intrínsecos múltiples"],
      ["Enterobacter cloacae complex / K. aerogenes / C. freundii", "Ampicilina, amoxicilina-clavulanato y cefalosporinas tempranas por AmpC", "Riesgo de inducción/selección; seguir reglas del laboratorio"],
    ],
    notes: ["Tabla deliberadamente limitada: especie, método y versión EUCAST/CLSI importan.", "No prescribe tratamiento; combine foco, PK/PD, susceptibilidad y guía local chilena."],
    source: "EUCAST — Expert Rules and Expected Phenotypes",
    sourceUrl: "https://www.eucast.org/expert_rules_and_expected_phenotypes",
  },
  "Score ISHAK en histopatología hepática": {
    title: "Estadio de fibrosis de Ishak",
    subtitle: "Clasificación histológica de fibrosis hepática en escala 0–6",
    columns: ["Estadio", "Descripción", "Interpretación"],
    rows: [
      ["0", "Sin fibrosis", "Ausente"],
      ["1", "Expansión fibrosa de algunos espacios porta, con o sin septos cortos", "Fibrosis mínima"],
      ["2", "Expansión fibrosa de la mayoría de espacios porta, con o sin septos cortos", "Fibrosis leve"],
      ["3", "Expansión portal con puentes porto-portales ocasionales", "Fibrosis moderada"],
      ["4", "Expansión portal con puentes porto-portales y porto-centrales marcados", "Fibrosis avanzada"],
      ["5", "Puentes marcados con nódulos ocasionales (cirrosis incompleta)", "Cirrosis incompleta"],
      ["6", "Cirrosis probable o definida", "Cirrosis"],
    ],
    notes: ["La actividad necroinflamatoria se puntúa por separado.", "Requiere biopsia adecuada y evaluación por anatomía patológica."],
    source: "Ishak et al. — Histological grading and staging of chronic hepatitis",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/7560864/",
  },
  "PRETEXT factor P": {
    title: "PRETEXT: factor portal P",
    subtitle: "Compromiso de la vena porta en imagen pretratamiento",
    columns: ["Categoría", "Definición", "Registrar"],
    rows: [["P0", "Sin compromiso de vena porta", "Ausencia"], ["P1", "Compromiso de una rama portal derecha o izquierda", "Rama y extensión"], ["P2", "Compromiso de ambas ramas principales o vena porta principal", "Oclusión, trombo o invasión"]],
    notes: ["Use criterios radiológicos PRETEXT 2017.", "La proximidad sin compromiso no equivale a invasión."],
    source: "Towbin et al. — 2017 PRETEXT radiologic staging system", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/29427028/",
  },
  "PRETEXT factor V": {
    title: "PRETEXT: factor venoso V",
    subtitle: "Compromiso de venas hepáticas y vena cava inferior",
    columns: ["Categoría", "Definición", "Registrar"],
    rows: [["V0", "Sin compromiso venoso", "Ausencia"], ["V1", "Una vena hepática comprometida", "Vena afectada"], ["V2", "Dos venas hepáticas comprometidas", "Venas afectadas"], ["V3", "Tres venas hepáticas y/o vena cava inferior comprometidas", "Extensión y trombo"]],
    notes: ["La evaluación es multiplanar y pretratamiento.", "Documente relación con cava suprahepática."],
    source: "Towbin et al. — 2017 PRETEXT radiologic staging system", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/29427028/",
  },
  "PRETEXT factores E, F, R, C, N y M": {
    title: "PRETEXT: factores de anotación E, F, R, C, N y M",
    subtitle: "Extensión tumoral adicional que acompaña al grupo PRETEXT y a V/P",
    columns: ["Factor", "Significado", "Qué documentar"],
    rows: [
      ["E", "Extensión extrahepática contigua", "Órgano/tejido y resecabilidad"],
      ["F", "Multifocalidad", "Número y distribución de focos"],
      ["R", "Ruptura tumoral", "Hallazgos de hemorragia/rotura"],
      ["C", "Compromiso del lóbulo caudado", "Extensión anatómica"],
      ["N", "Metástasis ganglionares", "Localización y confirmación"],
      ["M", "Metástasis a distancia", "Órgano, número y método"],
    ],
    notes: ["Consigne positivo/negativo para cada factor.", "F y C no sustituyen el grupo PRETEXT."],
    source: "Towbin et al. — 2017 PRETEXT radiologic staging system", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/29427028/",
  },
  "Criterios de enfermedad hepática autoinmune juvenil": {
    title: "Enfermedad hepática autoinmune juvenil",
    subtitle: "Parámetros recomendados para hepatitis autoinmune (HAI) y colangitis esclerosante autoinmune (ASC)",
    columns: ["Dominio", "Parámetro", "Utilidad"],
    rows: [
      ["Bioquímica", "ALT/AST, bilirrubina, GGT, INR y albúmina", "Actividad y gravedad"],
      ["Inmunología", "IgG elevada", "Apoya HAI; puede ser normal"],
      ["Autoanticuerpos", "ANA, SMA, anti-LKM1 y anti-LC1", "Fenotipo HAI-1/HAI-2; títulos pediátricos"],
      ["Histología", "Hepatitis de interfase, infiltrado portal/plasmocitario", "Confirmación y estadio"],
      ["Vía biliar", "Colangio-RM o colangiografía", "Diferencia ASC de HAI"],
      ["Exclusión", "Virus, fármacos, Wilson y otras causas", "Obligatoria antes del diagnóstico"],
    ],
    notes: ["No existe un único score pediátrico perfecto; los scores adultos pueden subdiagnosticar ASC.", "La falla hepática aguda requiere derivación inmediata y no esperar todos los anticuerpos."],
    source: "ESPGHAN Hepatology Committee — Juvenile autoimmune liver disease position statement",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/29356770/",
  },
});

// La rama ASAS necesita conocer combinaciones, no solo la suma; esta definición
// exacta tiene prioridad sobre la representación tabular anterior.
extendedCalculators["Espondilitis anquilosante"] = categorical(
  "Criterios ASAS para espondiloartritis axial",
  "Clasificación en pacientes con dolor lumbar ≥3 meses e inicio antes de 45 años",
  [
    select("Criterios de entrada", "entry", [["No cumple", "0"], ["Dolor ≥3 meses e inicio <45 años", "1"]]),
    select("Sacroileítis en imagen", "imaging", [["No", "0"], ["Sí", "1"]]),
    select("HLA-B27", "hla", [["Negativo/no disponible", "0"], ["Positivo", "1"]]),
    num("Características adicionales de espondiloartritis", "features", "n", "0", { min: 0, max: 11, step: "1" }),
  ],
  (v) => {
    if (v.entry !== "1") return { value: "No elegible", interpretation: "No cumple los criterios de entrada ASAS." };
    const imagingArm = v.imaging === "1" && n(v, "features") >= 1;
    const hlaArm = v.hla === "1" && n(v, "features") >= 2;
    return { value: imagingArm || hlaArm ? "Cumple clasificación ASAS" : "No cumple", interpretation: `${imagingArm ? "Rama de imagen positiva. " : ""}${hlaArm ? "Rama HLA-B27 positiva. " : ""}Características SpA: dolor inflamatorio, artritis, entesitis, uveítis, dactilitis, psoriasis, Crohn/colitis, buena respuesta a AINE, antecedente familiar, HLA-B27 y PCR elevada según la rama.` };
  },
  "Rudwaleit et al. — ASAS classification criteria for axial spondyloarthritis",
  "https://pubmed.ncbi.nlm.nih.gov/19297344/"
);

const romeSource = "https://pmc.ncbi.nlm.nih.gov/articles/PMC7104693/";
const romeConfigs: Record<string, { title: string; criteria: string[] }> = {
  "Roma IV para migraña abdominal": { title: "Roma IV: migraña abdominal", criteria: ["≥2 episodios en 6 meses", "Dolor intenso periumbilical/medial/difuso ≥1 hora", "Episodios separados por semanas/meses con salud basal", "Dolor incapacitante y patrón estereotipado", "≥2: anorexia, náusea, vómito, cefalea, fotofobia o palidez", "Tras evaluación, no atribuible a otra condición"] },
  "Roma IV para aerofagia": { title: "Roma IV: aerofagia", criteria: ["Deglución excesiva de aire", "Distensión abdominal que aumenta durante el día", "Eructos o flatos repetitivos", "≥2 meses antes del diagnóstico", "No explicada por otra condición"] },
  "Roma IV para estreñimiento": { title: "Roma IV: estreñimiento funcional", criteria: ["≥2 criterios de retención/evacuación aplicables a la edad", "Frecuencia mínima durante ≥1 mes", "No cumple criterios de SII", "Tras evaluación, no atribuible a otra condición"] },
  "Roma IV para síndrome de vómitos cíclicos": { title: "Roma IV: vómitos cíclicos", criteria: ["≥2 períodos de náusea intensa y vómitos en 6 meses", "Episodios estereotipados", "Separados por semanas/meses con retorno basal", "Tras evaluación, no atribuible a otra condición"] },
  "Roma IV para dolor abdominal funcional": { title: "Roma IV: dolor abdominal funcional-NOS", criteria: ["Dolor episódico o continuo ≥4 días/mes", "Criterios insuficientes para SII, dispepsia o migraña abdominal", "≥2 meses antes del diagnóstico", "No explicado por otra condición"] },
  "Roma IV para dispepsia funcional": { title: "Roma IV: dispepsia funcional", criteria: ["≥1: plenitud posprandial, saciedad precoz, dolor o ardor epigástrico", "≥4 días/mes", "≥2 meses antes del diagnóstico", "No explicado por otra condición"] },
  "Roma IV para náusea y vómito funcional": { title: "Roma IV: náusea/vómito funcional", criteria: ["Náusea predominante ≥2 veces/semana o vómito ≥1/semana", "No autoinducido ni explicado por trastorno alimentario/rumiación", "≥2 meses antes del diagnóstico", "No explicado por otra condición"] },
  "Roma IV para síndrome de intestino irritable": { title: "Roma IV: síndrome de intestino irritable", criteria: ["Dolor abdominal ≥4 días/mes", "Relacionado con defecación o cambio en frecuencia/forma de heces", "En estreñimiento, el dolor no desaparece al resolverlo", "≥2 meses antes del diagnóstico", "No explicado por otra condición"] },
  "Roma IV para incontinencia fecal no retentiva": { title: "Roma IV: incontinencia fecal no retentiva", criteria: ["Edad de desarrollo ≥4 años", "Defecación inapropiada ≥1 vez/mes", "Sin retención fecal", "≥2 meses antes del diagnóstico", "No explicada por otra condición"] },
  "Roma IV para síndrome de rumiación": { title: "Roma IV: síndrome de rumiación", criteria: ["Regurgitación repetida poco después de comer", "No ocurre durante el sueño", "No precedida por arcadas", "≥2 meses antes del diagnóstico", "No explicada por otra condición"] },
};

for (const [name, config] of Object.entries(romeConfigs)) {
  extendedScores[name] = {
    title: config.title,
    subtitle: "Evaluador de cumplimiento completo; los criterios no se convierten en una puntuación diagnóstica",
    rows: config.criteria.map((criterion, index) => ({ key: `criterion-${index}`, label: criterion, options: noYes(1) })),
    interpret: (score: number) => score === config.criteria.length ? "Todos los criterios estructurados están presentes; compatible con el diagnóstico Roma IV tras evaluación clínica apropiada." : `${score}/${config.criteria.length} criterios presentes: no se documenta cumplimiento completo de esta definición.`,
    source: "Hyams et al. — Childhood Functional Gastrointestinal Disorders: Child/Adolescent, Rome IV",
    sourceUrl: romeSource,
  };
}

Object.assign(extendedScores, {
  "Criterios internacionales para enfermedad de Behçet": {
    title: "International Criteria for Behçet Disease (ICBD)", subtitle: "Clasificación; ≥4 puntos",
    rows: [
      { key: "oral", label: "Aftosis oral", options: absentPresent(2) }, { key: "genital", label: "Aftosis genital", options: absentPresent(2) },
      { key: "ocular", label: "Lesiones oculares", options: absentPresent(2) }, { key: "skin", label: "Lesiones cutáneas", options: absentPresent(1) },
      { key: "vascular", label: "Manifestaciones vasculares", options: absentPresent(1) }, { key: "neuro", label: "Manifestaciones neurológicas", options: absentPresent(1) }, { key: "pathergy", label: "Pathergy positivo", options: absentPresent(1) },
    ],
    interpret: (s: number) => s >= 4 ? `ICBD ${s}: cumple clasificación (≥4).` : `ICBD ${s}: no alcanza el umbral.`, source: "International Team for the Revision of the International Criteria for Behçet's Disease", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/23441863/",
  },
  "Criterios de púrpura de Henoch–Schönlein": {
    title: "EULAR/PRINTO/PRES para vasculitis IgA", subtitle: "Púrpura/petequias de predominio en extremidades inferiores es obligatoria, más ≥1 criterio",
    rows: [{ key: "purpura", label: "Púrpura/petequias obligatoria", options: noYes(100) }, { key: "abdomen", label: "Dolor abdominal", options: noYes() }, { key: "arthritis", label: "Artritis/artralgia", options: noYes() }, { key: "renal", label: "Afectación renal", options: noYes() }, { key: "histology", label: "Histología con IgA predominante", options: noYes() }],
    interpret: (s: number) => s >= 101 ? `Cumple clasificación (${s - 100} criterio(s) adicional(es)).` : "No cumple: falta púrpura obligatoria o un criterio adicional.", source: "EULAR/PRINTO/PRES Ankara 2008 criteria", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/20413568/",
  },
  "Poliarteritis nodosa": {
    title: "EULAR/PRINTO/PRES para PAN pediátrica", subtitle: "Anomalía angiográfica o biopsia necrotizante obligatoria, más ≥1 criterio",
    rows: [{ key: "mandatory", label: "Biopsia o angiografía compatible", options: noYes(100) }, { key: "skin", label: "Afectación cutánea", options: noYes() }, { key: "muscle", label: "Mialgia/sensibilidad muscular", options: noYes() }, { key: "hypertension", label: "Hipertensión", options: noYes() }, { key: "neuropathy", label: "Neuropatía periférica", options: noYes() }, { key: "renal", label: "Afectación renal", options: noYes() }],
    interpret: (s: number) => s >= 101 ? "Cumple clasificación pediátrica de PAN." : "No cumple la combinación obligatoria.", source: "EULAR/PRINTO/PRES Ankara 2008 criteria", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/20413568/",
  },
  "Criterios diagnósticos de Kawasaki": {
    title: "Criterios clínicos de enfermedad de Kawasaki", subtitle: "Fiebre y características principales; considerar Kawasaki incompleto con inflamación compatible",
    rows: [{ key: "fever", label: "Fiebre ≥5 días (o antes con ≥4 rasgos)", options: noYes(100) }, { key: "conjunctiva", label: "Conjuntivitis bilateral no exudativa", options: noYes() }, { key: "oral", label: "Cambios orales/labiales", options: noYes() }, { key: "rash", label: "Exantema polimorfo", options: noYes() }, { key: "extremities", label: "Cambios en extremidades", options: noYes() }, { key: "nodes", label: "Linfadenopatía cervical", options: noYes() }],
    interpret: (s: number) => s >= 104 ? "Fiebre + ≥4 características: presentación clásica compatible." : s >= 102 ? `Fiebre + ${s - 100} características: evaluar algoritmo de Kawasaki incompleto, ecocardiografía y laboratorio.` : "No cumple presentación clásica; no excluye Kawasaki, especialmente en lactantes.", source: "AHA Scientific Statement — Kawasaki Disease", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/39534969/",
  },
  "Criterios de Rochester para lactantes febriles": {
    title: "Criterios de Rochester", subtitle: "Bajo riesgo histórico en lactantes febriles ≤60 días; protocolos actuales incorporan edad y marcadores inflamatorios",
    rows: [{ key: "well", label: "Buen aspecto", options: noYes() }, { key: "healthy", label: "Previamente sano y a término", options: noYes() }, { key: "focus", label: "Sin infección focal en examen", options: noYes() }, { key: "wbc", label: "Leucocitos 5.000–15.000/mm³", options: noYes() }, { key: "bands", label: "Bandas absolutas ≤1.500/mm³", options: noYes() }, { key: "urine", label: "Orina ≤10 leucocitos/campo", options: noYes() }, { key: "stool", label: "Si diarrea, heces ≤5 leucocitos/campo", options: noYes() }],
    interpret: (s: number) => s === 7 ? "Cumple todos los criterios históricos de bajo riesgo de Rochester." : `${s}/7: no cumple bajo riesgo. Use una vía actual por edad (AAP 8–60 días) y no retrase tratamiento si el lactante está enfermo.`, source: "Dagan et al. — Rochester criteria", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/2777655/",
  },
  "Regla de 7 para meningitis de Lyme": {
    title: "Rule of 7s para meningitis de Lyme", subtitle: "Niños con meningitis aséptica en área endémica; ≤2 puntos identifica bajo riesgo",
    rows: [{ key: "neutrophils", label: "Neutrófilos LCR ≥70%", options: noYes(2) }, { key: "headache", label: "Cefalea <7 días", options: noYes(1) }, { key: "facial", label: "Parálisis del VII par", options: noYes(1) }, { key: "season", label: "Exposición en área endémica abril–octubre", options: noYes(1) }, { key: "othercn", label: "Ausencia de otra neuropatía craneal", options: noYes(1) }, { key: "papilledema", label: "Ausencia de papiledema", options: noYes(1) }],
    interpret: (s: number) => s <= 2 ? `Score ${s}: bajo riesgo en la validación; considerar manejo según prevalencia y pruebas.` : `Score ${s}: no es bajo riesgo; evaluar/tratar Lyme según contexto.`, source: "Cohn et al. — clinical prediction rule for Lyme meningitis", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/22331384/",
  },
});

const dsmSource = "https://www.msdmanuals.com/professional/psychiatric-disorders";
const dsmConfigs: Record<string, { title: string; domains: string[] }> = {
  "Criterios DSM-5 para anorexia nerviosa": { title: "Anorexia nerviosa", domains: ["Restricción con peso significativamente bajo", "Miedo intenso a aumentar de peso o conducta que interfiere con ganancia", "Alteración de imagen corporal o falta de reconocimiento de gravedad", "Causas médicas y otros trastornos evaluados"] },
  "Criterios DSM-5 para TDAH": { title: "TDAH", domains: ["Número de síntomas de inatención y/o hiperactividad-impulsividad cumple umbral por edad", "Síntomas antes de los 12 años", "Presentes en ≥2 contextos", "Interferencia funcional clara", "No mejor explicados por otro trastorno"] },
  "Criterios DSM-5 para ARFID": { title: "ARFID", domains: ["Alteración de ingesta con pérdida/deficiencia/suplementación o interferencia psicosocial", "No por falta de alimentos ni práctica cultural", "No ocurre exclusivamente en anorexia/bulimia y sin preocupación por figura", "No mejor explicada por condición médica u otro trastorno"] },
  "Criterios DSM-5 para trastorno por atracón": { title: "Trastorno por atracón", domains: ["Episodios con pérdida de control", "≥3 características asociadas", "Malestar intenso", "Frecuencia/duración DSM cumplida", "Sin compensación regular ni exclusivo de bulimia/anorexia"] },
  "Criterios DSM-5 para dismorfia corporal": { title: "Trastorno dismórfico corporal", domains: ["Preocupación por defecto no observable o leve", "Conductas mentales/repetitivas", "Malestar o deterioro", "No explicado por preocupación de grasa/peso en trastorno alimentario"] },
  "Criterios DSM-5 para bulimia nerviosa": { title: "Bulimia nerviosa", domains: ["Atracones recurrentes", "Conductas compensatorias recurrentes", "Frecuencia/duración DSM cumplida", "Autoevaluación influida por figura/peso", "No ocurre exclusivamente durante anorexia"] },
  "Criterios DSM-5 para trastorno de conducta": { title: "Trastorno de conducta", domains: ["Patrón de vulneración de derechos/normas con número y ventana temporal requeridos", "Deterioro clínico", "Especificar inicio y emociones prosociales", "Si ≥18 años, no cumple personalidad antisocial"] },
  "Criterios DSM-5 para desregulación disruptiva del ánimo": { title: "Desregulación disruptiva del ánimo", domains: ["Arrebatos graves recurrentes desproporcionados", "Ánimo irritable persistente entre episodios", "Frecuencia, duración y edad de inicio requeridas", "Presente en múltiples contextos", "Exclusiones de manía y otros trastornos aplicadas"] },
  "Criterios DSM-5 para trastorno depresivo persistente": { title: "Trastorno depresivo persistente", domains: ["Ánimo deprimido/irritable la mayor parte del día", "Síntomas asociados suficientes", "Duración requerida por edad", "Sin períodos prolongados libres", "Exclusiones médicas, sustancias, bipolaridad y psicóticos"] },
  "Criterios DSM-5 para ansiedad generalizada": { title: "Ansiedad generalizada", domains: ["Ansiedad/preocupación excesiva sobre varios ámbitos", "Dificultad para controlarla", "Síntomas asociados suficientes por edad", "Duración ≥6 meses", "Malestar/deterioro y exclusiones aplicadas"] },
  "Criterios DSM-5 para episodio depresivo mayor": { title: "Episodio depresivo mayor", domains: ["≥5 síntomas en 2 semanas con ánimo deprimido/irritable o anhedonia", "Cambio respecto del funcionamiento", "Malestar/deterioro", "No atribuible a sustancia/condición", "Historia de manía/hipomanía evaluada"] },
  "Criterios DSM-5 para episodio maníaco": { title: "Episodio maníaco", domains: ["Ánimo elevado/irritable y aumento de energía", "Síntomas asociados suficientes", "Duración ≥1 semana o cualquier duración si hospitalización", "Deterioro grave/hospitalización/psicosis", "No atribuible a sustancia/condición"] },
  "Criterios DSM-5 para trastorno negativista desafiante": { title: "Trastorno negativista desafiante", domains: ["≥4 síntomas de ánimo irritable, discusión/desafío o venganza", "Duración ≥6 meses", "Interacción con al menos alguien no hermano", "Frecuencia apropiada a edad", "Malestar/deterioro y exclusiones"] },
  "Criterios DSM-5 para pánico y agorafobia": { title: "Pánico/agorafobia", domains: ["Ataques de pánico inesperados recurrentes o miedo/situaciones agorafóbicas", "Preocupación/cambio conductual o evitación persistente", "Duración requerida", "Malestar/deterioro", "Exclusiones médicas, sustancias y otros trastornos"] },
  "Criterios DSM-5 para estrés postraumático en menores de 6 años": { title: "TEPT en menores de 6 años", domains: ["Exposición traumática elegible", "Síntomas de intrusión", "Evitación/cambios negativos", "Alteración de activación/reactividad", "Duración >1 mes, deterioro y exclusiones"] },
  "Criterios DSM-5 para ansiedad por separación": { title: "Ansiedad por separación", domains: ["≥3 síntomas de miedo/separación inapropiados", "Duración requerida por edad", "Malestar/deterioro", "No mejor explicado por otro trastorno"] },
  "Criterios DSM-5 para trastorno de comunicación social": { title: "Trastorno de comunicación social", domains: ["Dificultades persistentes en uso social de comunicación", "Limitaciones funcionales", "Inicio temprano", "No explicado por lenguaje, autismo, neurología u otro trastorno"] },
  "Criterios DSM-5 para ansiedad social": { title: "Ansiedad social", domains: ["Miedo marcado a evaluación social", "Situaciones casi siempre provocan miedo y se evitan/soportan", "Desproporcionado y persistente", "Malestar/deterioro", "Exclusiones aplicadas"] },
};

for (const [name, config] of Object.entries(dsmConfigs)) {
  extendedScores[name] = {
    title: `Evaluación estructurada: ${config.title}`,
    subtitle: "Resumen operativo de dominios DSM-5-TR; no es un test de cribado validado ni sustituye entrevista diagnóstica",
    rows: config.domains.map((domain, index) => ({ key: `domain-${index}`, label: domain, options: noYes(1) })),
    interpret: (score: number) => score === config.domains.length ? "Todos los dominios resumidos están documentados; requiere confirmación diagnóstica profesional, gravedad, riesgo y diagnóstico diferencial." : `${score}/${config.domains.length} dominios documentados: la ficha no demuestra cumplimiento completo.`,
    source: "DSM-5-TR; resumen clínico verificable en MSD Manual Professional",
    sourceUrl: dsmSource,
  };
}

Object.assign(extendedReferences, {
  "Valores de referencia de inmunoglobulinas": {
    title: "Inmunoglobulinas séricas por edad", subtitle: "Los intervalos dependen de edad y método; seleccione la fila y confirme con el laboratorio",
    columns: ["Analito", "Patrón de maduración", "Interpretación"], rows: [["IgG", "Desciende tras nacimiento y luego aumenta", "Usar percentiles por edad"], ["IgA", "Muy baja al nacer; aumenta gradualmente", "Un valor infantil bajo puede ser fisiológico"], ["IgM", "Aumenta desde el nacimiento", "Elevación neonatal puede sugerir respuesta intrauterina"], ["IgE", "Amplia variabilidad", "Interpretar con clínica alérgica/parasitológica"]],
    notes: ["Use el intervalo específico del laboratorio y edad exacta.", "Correlacione con respuesta a vacunas y fenotipo infeccioso."], source: "Mayo Clinic Laboratories — Pediatric Immunoglobulins", sourceUrl: "https://pediatric.testcatalog.org/",
  },
  "Valores de subpoblaciones linfocitarias": {
    title: "Subpoblaciones linfocitarias", subtitle: "Valores absolutos y porcentajes cambian marcadamente en infancia",
    columns: ["Población", "Marcadores", "Uso"], rows: [["T totales", "CD3+", "Inmunidad celular"], ["T helper", "CD3+ CD4+", "Relación CD4/CD8 y déficits"], ["T citotóxicos", "CD3+ CD8+", "Inmunidad celular"], ["B", "CD19+ o CD20+", "Inmunidad humoral"], ["NK", "CD3− CD16+/CD56+", "Citotoxicidad innata"]], notes: ["Interpretar recuento absoluto y porcentaje con referencia por edad.", "Esteroides, infección aguda y tratamiento modifican resultados."], source: "NIH/Immune Deficiency Foundation — laboratory evaluation", sourceUrl: "https://primaryimmune.org/understanding-primary-immunodeficiency/diagnosis/laboratory-tests",
  },
  "Recuento de subpoblaciones linfocitarias": {
    title: "Cálculo de recuentos absolutos de subpoblaciones", subtitle: "Fórmula para convertir porcentaje de citometría a células/µL",
    columns: ["Paso", "Fórmula", "Ejemplo"], rows: [["Linfocitos absolutos", "Leucocitos × % linfocitos", "8.000 × 0,40 = 3.200/µL"], ["CD4 absoluto", "Linfocitos absolutos × %CD4", "3.200 × 0,45 = 1.440/µL"], ["CD8 absoluto", "Linfocitos absolutos × %CD8", "Misma fórmula"], ["B/NK absolutos", "Linfocitos absolutos × % población", "Misma fórmula"]], notes: ["Use porcentajes como fracción decimal.", "Confirme si el laboratorio ya reporta recuento absoluto."], source: "CDC — flow cytometry principles for lymphocyte subsets", sourceUrl: "https://www.cdc.gov/mmwr/preview/mmwrhtml/00032069.htm",
  },
  "Criterios MEDPED para hipercolesterolemia familiar": {
    title: "Umbrales MEDPED de colesterol total", subtitle: "Puntos de corte de alta especificidad según edad y grado de familiar afectado",
    columns: ["Edad", "1.er grado", "2.º grado / 3.er grado / población general"], rows: [["<20", "≥220 mg/dL", "≥230 / ≥240 / ≥270"], ["20–29", "≥240", "≥250 / ≥260 / ≥290"], ["30–39", "≥270", "≥280 / ≥290 / ≥340"], ["≥40", "≥290", "≥300 / ≥310 / ≥360"]], notes: ["Criterios históricos basados en colesterol total; use evaluación genética/clínica contemporánea.", "Excluir causas secundarias."], source: "MEDPED / AHRQ evidence review", sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK379719/table/appd.t1/",
  },
  "Guía EASL para hepatitis B": {
    title: "Variables para fase y tratamiento de hepatitis B", subtitle: "Hoja de clasificación; la versión y población determinan la recomendación",
    columns: ["Variable", "Resultado", "Implicación"], rows: [["HBsAg/anti-HBc/anti-HBs", "Patrón serológico", "Infección, inmunidad o susceptibilidad"], ["HBeAg y ADN-VHB", "Replicación", "Define fase y actividad viral"], ["ALT seriada", "Inflamación", "Usar límite superior específico"], ["Fibrosis/cirrosis", "Elastografía/biopsia/imagen", "Cirrrosis cambia umbral de tratamiento"], ["Embarazo/inmunosupresión", "Contextos especiales", "Profilaxis y prevención de reactivación"]], notes: ["No derive tratamiento de una sola medición.", "Compruebe coinfecciones, función renal y riesgo HCC."], source: "EASL Clinical Practice Guidelines on hepatitis B", sourceUrl: "https://easl.eu/publication/management-of-hepatitis-b-virus-infection/",
  },
  "Longitud hepática media estimada": {
    title: "Longitud hepática pediátrica", subtitle: "La técnica y la edad modifican la referencia",
    columns: ["Método", "Medición", "Interpretación"], rows: [["Percusión/palpación", "Línea medio-clavicular", "Baja precisión; correlacionar con clínica"], ["Ecografía", "Eje cráneo-caudal del lóbulo derecho", "Usar curva local por edad/talla"], ["Hallazgo aumentado", "Sobre percentil/LLN del método", "Evaluar congestión, infiltración, inflamación o masa"]], notes: ["No convertir una fórmula aproximada en diagnóstico de hepatomegalia.", "La ecografía estandarizada es preferible."], source: "Konuş et al. — normal liver, spleen and kidney dimensions in children", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/9730342/",
  },
  "Longitud esplénica normal por ecografía": {
    title: "Longitud esplénica pediátrica por ecografía", subtitle: "Comparar con referencia por edad/talla y técnica",
    columns: ["Edad", "Límite superior orientativo", "Nota"], rows: [["0–3 meses", "≈6 cm", "Usar nomograma local"], ["6–12 meses", "≈6,5 cm", "Dependiente de talla"], ["1–2 años", "≈8 cm", "Dependiente de talla"], ["2–4 años", "≈9 cm", "Dependiente de talla"], ["4–6 años", "≈9,5 cm", "Dependiente de talla"], ["6–8 años", "≈10 cm", "Dependiente de talla"], ["8–10 años", "≈11 cm", "Dependiente de talla"], ["10–12 años", "≈11,5 cm", "Dependiente de sexo/talla"], [">12 años", "≈12–13 cm", "Usar referencia adolescente/adulta"]], notes: ["Valores orientativos, no sustituyen percentiles de la población/equipo.", "Medir en eje longitudinal máximo con técnica consistente."], source: "Rosenberg et al. — normal splenic size in infants and children", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/2048509/",
  },
  "Ingestas dietéticas de referencia": {
    title: "Tipos de Dietary Reference Intakes", subtitle: "Marco para interpretar requerimientos poblacionales",
    columns: ["Sigla", "Significado", "Uso"], rows: [["EAR", "Requerimiento promedio estimado", "Cubre 50% del grupo"], ["RDA", "Ingesta recomendada", "Cubre casi todos los sanos"], ["AI", "Ingesta adecuada", "Cuando no puede establecerse RDA"], ["UL", "Nivel máximo tolerable", "Evitar riesgo por exceso"], ["CDRR", "Reducción de riesgo de enfermedad crónica", "Nutrientes específicos"]], notes: ["No son objetivos terapéuticos para enfermedad crítica.", "Seleccionar edad, sexo, embarazo y lactancia."], source: "National Academies — Dietary Reference Intakes", sourceUrl: "https://www.nationalacademies.org/our-work/dietary-reference-intakes-dris",
  },
  "Valor biológico de alimentos": {
    title: "Calidad proteica", subtitle: "El valor biológico histórico no sustituye DIAAS/PDCAAS ni el contexto dietario",
    columns: ["Indicador", "Qué mide", "Limitación"], rows: [["Valor biológico", "Nitrógeno retenido/absorbido", "No incorpora digestibilidad ileal individual"], ["PDCAAS", "Aminoácidos + digestibilidad fecal", "Truncado en 1,0"], ["DIAAS", "Aminoácidos indispensables digestibles", "Requiere datos ileales"], ["Complementación", "Combina perfiles de aminoácidos", "Importa la dieta total"]], notes: ["Evitar listas universales de “mejor alimento”.", "Ajustar a edad, patrón dietario y enfermedad."], source: "FAO — Dietary protein quality evaluation in human nutrition", sourceUrl: "https://www.fao.org/4/i3124e/i3124e.pdf",
  },
  "Composición de leche humana por período posparto": {
    title: "Cambios de la leche humana", subtitle: "Valores variables por madre, momento del día y extracción",
    columns: ["Período", "Características", "Uso clínico"], rows: [["Calostro (1–5 días)", "Más proteína e inmunofactores; menor volumen", "Adecuado al recién nacido"], ["Transición (≈5–14 días)", "Aumentan volumen, grasa y lactosa", "Cambios rápidos"], ["Madura (>2 semanas)", "≈65–70 kcal/100 mL en promedio", "Composición dinámica"], ["Leche de pretérmino", "Mayor proteína inicialmente", "Puede requerir fortificación"]], notes: ["No use un único valor para dosificar nutrientes en prematuros.", "Valorar crecimiento y fortificación individual."], source: "American Academy of Pediatrics — Breastfeeding and the Use of Human Milk", sourceUrl: "https://publications.aap.org/pediatrics/article/150/1/e2022057988/188347/Policy-Statement-Breastfeeding-and-the-Use-of",
  },
  "Valores nutricionales de frutas": {
    title: "Consulta nutricional de frutas", subtitle: "Valores aproximados por 100 g de porción comestible",
    columns: ["Fruta", "Energía", "Fibra / observación"], rows: [["Manzana con piel", "≈52 kcal", "≈2,4 g"], ["Plátano", "≈89 kcal", "≈2,6 g"], ["Naranja", "≈47 kcal", "≈2,4 g"], ["Frutilla", "≈32 kcal", "≈2,0 g"], ["Palta", "≈160 kcal", "≈6,7 g; alta en grasa monoinsaturada"]], notes: ["Variedad y madurez modifican valores.", "Preferir base oficial para cálculos dietarios exactos."], source: "USDA FoodData Central", sourceUrl: "https://fdc.nal.usda.gov/",
  },
  "Ingesta diaria recomendada de vitaminas y minerales": {
    title: "Vitaminas y minerales: consulta DRI", subtitle: "La cifra correcta depende de nutriente, edad, sexo y etapa fisiológica",
    columns: ["Grupo", "Qué seleccionar", "Precaución"], rows: [["Lactantes", "AI/RDA por 0–6 y 7–12 meses", "Evitar extrapolar dosis adultas"], ["Niños", "RDA/AI por 1–3, 4–8, 9–13", "Revisar UL"], ["Adolescentes", "Por sexo y 14–18 años", "Hierro y calcio difieren"], ["Embarazo/lactancia", "Tabla específica", "Ácido fólico/yodo/hierro según guía"], ["Adultos mayores", "Tabla ≥51/≥70", "Vitamina D/B12 según riesgo"]], notes: ["Seleccione el nutriente en la tabla oficial enlazada.", "El UL no es una meta de ingesta."], source: "NIH Office of Dietary Supplements — Nutrient Recommendations and Databases", sourceUrl: "https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx",
  },
});

const torontoSource = "https://discovery.ucl.ac.uk/id/eprint/1489969/1/Pritchard-Jones_Pediatric%20Cancer%20Staging%20Guidelines%20for%20Registries_Revision2_Marked.pdf";
const torontoSystems: Record<string, string[][]> = {
  "Toronto: estadificación de leucemia linfoblástica aguda": [["Tier 1", "CNS/testículo al diagnóstico", "Registrar compromiso extramedular"], ["Tier 2", "NCI risk group + genética", "Edad, leucocitos y marcadores"]],
  "Toronto: estadificación de leucemia mieloide aguda": [["Tier 1", "Enfermedad localizada/diseminada", "Registrar sarcoma mieloide y SNC"], ["Tier 2", "Genética y respuesta", "Clasificación de riesgo contemporánea"]],
  "Toronto: estadificación de ependimoma": [["Tier 1", "M0/M+", "Metástasis por LCR/neuroeje"], ["Tier 2", "Localización y resección", "Supratentorial/posterior y residual"]],
  "Toronto: estadificación de sarcoma de Ewing": [["Tier 1", "Localizado/metastásico", "Pulmón, hueso y médula"], ["Tier 2", "Volumen/localización", "Tamaño y sitio primario"]],
  "Toronto: estadificación de hepatoblastoma": [["PRETEXT", "I–IV", "Sectores hepáticos libres/comprometidos"], ["Factores", "V/P/E/F/R/C/N/M", "Anotar todos los factores de extensión"]],
  "Toronto: estadificación de linfoma de Hodgkin": [["Ann Arbor/Lugano pediátrico", "I–IV + A/B/E/S", "Sitios y síntomas B"], ["Respuesta", "Metabólica/volumétrica", "No reemplaza estadio inicial"]],
  "Toronto: estadificación de meduloblastoma y tumores embrionarios SNC": [["Chang M", "M0–M4", "Diseminación LCR/neuroeje"], ["Riesgo integrado", "Edad, residual y molecular", "Documentar grupo molecular"]],
  "Toronto: estadificación de neuroblastoma": [["INRGSS", "L1/L2/M/MS", "IDRF y metástasis pretratamiento"], ["INSS", "1–4/4S", "Sistema quirúrgico histórico"]],
  "Toronto: estadificación de linfoma no Hodgkin": [["St Jude/Murphy", "I–IV", "Sitios nodales/extranodales, médula y SNC"], ["Subtipo", "Maduro B, linfoblástico, ALCL", "Interpretar con biología"]],
  "Toronto: sarcoma de partes blandas no rabdomiosarcoma": [["TNM/IRS", "Tamaño, invasión, nodos, metástasis", "Usar sistema histología-específico"], ["Grado", "Bajo/intermedio/alto", "Sistema patológico aplicable"]],
  "Toronto: estadificación de osteosarcoma": [["Tier 1", "Localizado/metastásico", "Pulmón, hueso y skip lesions"], ["Enneking/AJCC", "Extensión y grado", "Registrar resecabilidad y respuesta"]],
  "Toronto: estadificación de cáncer de ovario": [["FIGO", "I–IV", "Cápsula, lavado, pelvis/abdomen/metástasis"], ["Histología", "Germinal/epitelial/estromal", "Sistema depende de subtipo"]],
  "Toronto: estadificación de retinoblastoma": [["IRSS", "0–IV", "Enucleación, margen, nodos/metástasis"], ["IIRC/IAC", "A–E", "Clasificación intraocular por ojo"]],
  "Toronto: estadificación de rabdomiosarcoma": [["TNM pretratamiento", "Sitio, T, tamaño, N, M", "Define stage 1–4"], ["Grupo clínico IRS", "I–IV", "Extensión/resección quirúrgica"]],
  "Toronto: estadificación de cáncer testicular": [["COG", "I–IV", "Marcadores, imagen y cirugía"], ["TNM/FIGO", "Según histología/edad", "Registrar AFP ajustada por edad"]],
  "Toronto: estadificación de tumor de Wilms": [["COG/NWTS", "I–V", "Estadio quirúrgico-patológico"], ["SIOP", "I–V", "Tras quimioterapia preoperatoria"]],
};
for (const [name, rows] of Object.entries(torontoSystems)) {
  extendedReferences[name] = { title: name, subtitle: "Hoja de estadificación Toronto: seleccione el sistema y documente todos los parámetros antes de asignar estadio", columns: ["Sistema", "Resultado posible", "Parámetros obligatorios"], rows, notes: ["No asignar estadio sin anatomía patológica e imagen completas.", "La guía Toronto estandariza registro poblacional; el protocolo terapéutico puede usar una estratificación adicional."], source: "Toronto Paediatric Cancer Stage Guidelines", sourceUrl: torontoSource };
}

// Definiciones adicionales verificadas para que ninguna entrada del catálogo
// termine en una ficha genérica. Cuando una herramienta publicada requiere una
// lámina, histología o versión licenciada, CalcMed pide el resultado validado y
// evita reconstruir umbrales no publicados.
Object.assign(extendedCalculators, {
  "Regla Palchak para traumatismo craneal pediátrico": categorical(
    "Regla UC Davis–Palchak para traumatismo craneal",
    "Regla histórica de predicción para niños con traumatismo craneal; PECARN dispone de una validación multicéntrica más amplia",
    [
      select("Estado mental", "mental", [["Normal", "0"], ["Alterado", "1"]]),
      select("Exploración del cráneo", "fracture", [["Sin signos de fractura", "0"], ["Signos de fractura de cráneo", "1"]]),
      select("Hematoma del cuero cabelludo", "hematoma", [["Ausente", "0"], ["Presente en menor de 2 años", "1"]]),
      select("Pérdida de conciencia", "loc", [["No o ≤5 segundos", "0"], [">5 segundos", "1"]]),
      select("Mecanismo", "mechanism", [["No grave", "0"], ["Grave", "1"]]),
      select("Vómitos", "vomiting", [["No", "0"], ["Sí", "1"]]),
      select("Cefalea", "headache", [["No significativa", "0"], ["Significativa", "1"]]),
    ],
    (v) => {
      const total = ["mental", "fracture", "hematoma", "loc", "mechanism", "vomiting", "headache"].reduce((sum, key) => sum + Number(v[key]), 0);
      return { value: total === 0 ? "Muy bajo riesgo por la regla" : "Regla positiva", interpretation: `${total}/7 predictores presentes. ${total === 0 ? "Dentro de la población de derivación, no se identificaron predictores." : "La regla no clasifica como bajo riesgo; requiere observación, imagen o manejo según evaluación clínica."} Para práctica actual compare con PECARN y no aplique fuera de sus criterios de inclusión.` };
    },
    "Palchak et al. — A decision rule for identifying children at low risk for brain injuries after blunt head trauma",
    "https://pubmed.ncbi.nlm.nih.gov/14615760/"
  ),
  "Riesgo de carcinoma hepatocelular": {
    title: "PAGE-B para riesgo de carcinoma hepatocelular",
    subtitle: "Adultos caucásicos con hepatitis B crónica tratados con entecavir o tenofovir",
    fields: [
      num("Edad", "age", "años", "50", { min: 16, max: 100 }),
      select("Sexo", "sex", [["Femenino", "f"], ["Masculino", "m"]]),
      num("Plaquetas", "platelets", "×10⁹/L", "180", { min: 1, max: 1000 }),
    ],
    calculate: (v) => {
      const age = n(v, "age");
      const agePoints = age < 30 ? 0 : age < 40 ? 2 : age < 50 ? 4 : age < 60 ? 6 : age < 70 ? 8 : 10;
      const plateletPoints = n(v, "platelets") >= 200 ? 0 : n(v, "platelets") >= 100 ? 6 : 9;
      const score = agePoints + (v.sex === "m" ? 6 : 0) + plateletPoints;
      const risk = score <= 9 ? "bajo" : score <= 17 ? "intermedio" : "alto";
      return { value: String(score), unit: "puntos PAGE-B", interpretation: `Riesgo ${risk} (≤9 bajo, 10–17 intermedio, ≥18 alto). No sustituye el programa de vigilancia indicado por la guía local y no debe extrapolarse a poblaciones no validadas.` };
    },
    formula: "Edad (0–10) + sexo masculino (6) + plaquetas (0/6/9)",
    source: "Papatheodoridis et al. — PAGE-B score",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/25799975/",
  },
  "Score IGERQ": {
    title: "I-GERQ-R: cuestionario de reflujo gastroesofágico infantil",
    subtitle: "Interpreta el total obtenido con la versión validada de 12 ítems; no diagnostica ERGE por sí solo",
    fields: [num("Edad", "age", "meses", "3", { min: 0, max: 18 }), num("Puntuación I-GERQ-R validada", "score", "0–42", "12", { min: 0, max: 42, step: "1" })],
    calculate: (v) => {
      const score = n(v, "score");
      const flagged = score >= 16;
      return { value: String(score), unit: "puntos", interpretation: `${flagged ? "Alcanza" : "No alcanza"} el punto de corte histórico ≥16. La distribución cambia con la edad —especialmente en los primeros meses— y el cuestionario no diferencia con certeza reflujo fisiológico de ERGE. Correlacionar con crecimiento, alimentación, signos de alarma y evaluación médica.` };
    },
    formula: "Suma de la versión validada I-GERQ-R (12 ítems, 0–42)",
    source: "Kleinman et al. — Revised Infant Gastroesophageal Reflux Questionnaire",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/16678075/",
  },
  "Score de fibrosis NAFLD pediátrico": {
    title: "Pediatric NAFLD Fibrosis Score (PNFS)",
    subtitle: "Modelo de investigación para estimar fibrosis en niños con NAFLD; su rendimiento externo es limitado",
    fields: [num("ALT", "alt", "U/L", "60", { min: 0.01 }), num("Fosfatasa alcalina", "alp", "U/L", "250", { min: 0 }), num("Plaquetas", "platelets", "×10⁹/L", "250", { min: 1 }), num("GGT", "ggt", "U/L", "35", { min: 0 })],
    calculate: (v) => {
      const lp = 1.1 + 0.34 * Math.sqrt(n(v, "alt")) + 0.002 * n(v, "alp") - 1.1 * Math.log(n(v, "platelets")) - 0.02 * n(v, "ggt");
      const probability = 100 * Math.exp(lp) / (1 + Math.exp(lp));
      return { value: probability.toFixed(1), unit: "%", interpretation: `Probabilidad calculada por el modelo original (logit ${lp.toFixed(2)}). No confirma ni excluye fibrosis y no reemplaza elastografía, imagen, histología ni valoración hepatológica; validaciones externas han mostrado discriminación modesta.` };
    },
    formula: "LP=1,1+0,34√ALT+0,002×ALP−1,1×ln(plaquetas)−0,02×GGT; p=eᴸᴾ/(1+eᴸᴾ)",
    source: "Alkhouri et al. — Pediatric NAFLD Fibrosis Score",
    sourceUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4133235/",
  },
  "PRETEXT para hepatoblastoma": categorical(
    "PRETEXT para tumores hepáticos pediátricos",
    "Clasifica la extensión antes del tratamiento según sectores hepáticos contiguos libres de tumor",
    [select("Sectores hepáticos contiguos libres de tumor", "free", [["Tres sectores libres", "3"], ["Dos sectores libres", "2"], ["Un sector libre", "1"], ["Ningún sector libre", "0"]])],
    (v) => {
      const result: Record<string, string> = { "3": "PRETEXT I", "2": "PRETEXT II", "1": "PRETEXT III", "0": "PRETEXT IV" };
      return { value: result[v.free], interpretation: "Añada por separado los factores de anotación V, P, E, F, R, C, N y M. La asignación definitiva requiere revisión radiológica multiplanar y equipo oncológico hepatobiliar." };
    },
    "Towbin et al. — 2017 PRETEXT radiologic staging system",
    "https://pubmed.ncbi.nlm.nih.gov/29427028/"
  ),
  "Score de Ballard": {
    title: "New Ballard Score",
    subtitle: "Estimación de edad gestacional por seis signos neuromusculares y seis físicos",
    fields: [
      ...["Postura", "Ventana cuadrada de muñeca", "Retroceso del brazo", "Ángulo poplíteo", "Signo de la bufanda", "Talón a oreja", "Piel", "Lanugo", "Superficie plantar", "Mama", "Ojo/oreja", "Genitales"].map((label, index) => select(label, `b${index}`, [["−1 según lámina New Ballard", "-1"], ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]])),
    ],
    calculate: (v) => {
      const total = Array.from({ length: 12 }, (_, i) => n(v, `b${i}`)).reduce((a, b) => a + b, 0);
      const weeks = 24 + 0.4 * total;
      return { value: weeks.toFixed(1), unit: "semanas", interpretation: `Puntuación total ${total}. Seleccione cada categoría usando la lámina oficial New Ballard; los valores extremos y el recién nacido enfermo requieren experiencia clínica y correlación obstétrica.` };
    },
    formula: "Edad gestacional (semanas) = 24 + 0,4 × puntuación total",
    source: "Ballard et al. — New Ballard Score",
    sourceUrl: "https://www.ballardscore.com/files/newballardscore-monograph.pdf",
  },
  "Criterios EULAR para lupus eritematoso sistémico": categorical(
    "Criterios EULAR/ACR 2019 para lupus eritematoso sistémico",
    "Clasificación para investigación: ANA positivo es requisito de entrada y se cuenta solo el ítem más alto de cada dominio",
    [
      select("ANA ≥1:80 al menos una vez", "ana", [["No", "0"], ["Sí", "1"]]),
      select("Constitucional", "constitutional", [["Ninguno", "0"], ["Fiebre", "2"]]),
      select("Hematológico (solo el mayor)", "hematologic", [["Ninguno", "0"], ["Leucopenia", "3"], ["Trombocitopenia", "4"], ["Hemólisis autoinmune", "4"]]),
      select("Neuropsiquiátrico (solo el mayor)", "neuro", [["Ninguno", "0"], ["Delirio", "2"], ["Psicosis", "3"], ["Convulsión", "5"]]),
      select("Mucocutáneo (solo el mayor)", "skin", [["Ninguno", "0"], ["Alopecia no cicatricial", "2"], ["Úlceras orales", "2"], ["Lupus cutáneo subagudo o discoide", "4"], ["Lupus cutáneo agudo", "6"]]),
      select("Seroso (solo el mayor)", "serosal", [["Ninguno", "0"], ["Derrame pleural o pericárdico", "5"], ["Pericarditis aguda", "6"]]),
      select("Musculoesquelético", "joint", [["Ninguno", "0"], ["Compromiso articular", "6"]]),
      select("Renal (solo el mayor)", "renal", [["Ninguno", "0"], ["Proteinuria >0,5 g/24 h", "4"], ["Nefritis clase II o V", "8"], ["Nefritis clase III o IV", "10"]]),
      select("Antifosfolípidos", "apl", [["Negativos", "0"], ["Positivos", "2"]]),
      select("Complemento", "complement", [["Normal", "0"], ["C3 o C4 bajo", "3"], ["C3 y C4 bajos", "4"]]),
      select("Anticuerpos específicos", "specific", [["anti-dsDNA/anti-Sm negativos", "0"], ["anti-dsDNA o anti-Sm positivo", "6"]]),
    ],
    (v) => {
      if (v.ana !== "1") return { value: "No clasificable", interpretation: "No cumple el requisito de entrada ANA ≥1:80. Esto no excluye un diagnóstico clínico; los criterios no sustituyen juicio reumatológico." };
      const keys = ["constitutional", "hematologic", "neuro", "skin", "serosal", "joint", "renal", "apl", "complement", "specific"];
      const total = keys.reduce((sum, key) => sum + n(v, key), 0);
      const clinical = ["constitutional", "hematologic", "neuro", "skin", "serosal", "joint", "renal"].some((key) => n(v, key) > 0);
      return { value: String(total), unit: "puntos", interpretation: `${total >= 10 && clinical ? "Cumple" : "No cumple"} clasificación EULAR/ACR 2019 (umbral ≥10 y al menos un criterio clínico). Atribuya cada criterio a LES solo si no existe una explicación más probable.` };
    },
    "Aringer et al. — 2019 EULAR/ACR Classification Criteria for SLE",
    "https://pubmed.ncbi.nlm.nih.gov/31385462/"
  ),
  "Calculadora de enfermedad ósea pediátrica": categorical(
    "Definición densitométrica de osteoporosis pediátrica ISCD",
    "Integra fractura vertebral, historia de fracturas de huesos largos y Z-score de DMO",
    [
      select("Fractura vertebral por compresión", "vertebral", [["No", "0"], ["Sí, sin trauma de alta energía ni enfermedad local", "1"]]),
      num("Fracturas de huesos largos antes de los 10 años", "before10", "n", "0", { min: 0, max: 20, step: "1" }),
      num("Fracturas de huesos largos antes de los 19 años", "before19", "n", "0", { min: 0, max: 30, step: "1" }),
      num("Z-score de DMO ajustado", "z", "DE", "-1.0", { min: -10, max: 10 }),
    ],
    (v) => {
      const vertebral = v.vertebral === "1";
      const fractureHistory = n(v, "before10") >= 2 || n(v, "before19") >= 3;
      const lowBmd = n(v, "z") <= -2;
      const meets = vertebral || (fractureHistory && lowBmd);
      return { value: meets ? "Cumple definición ISCD" : "No cumple definición ISCD", interpretation: `${vertebral ? "Fractura vertebral compatible: suficiente independientemente de la DMO. " : ""}${fractureHistory ? "Historia de fracturas clínicamente significativa. " : ""}${lowBmd ? "DMO baja para la edad. " : ""}No use “osteopenia” en pediatría; ajuste Z-score por edad, sexo, talla y maduración según corresponda.` };
    },
    "ISCD Official Pediatric Positions 2019",
    "https://iscd.org/learn/official-positions/pediatric-positions/"
  ),
  "Abordaje paso a paso del lactante febril": categorical(
    "Step-by-Step para lactantes febriles ≤90 días",
    "Estratificación secuencial de riesgo de infección bacteriana invasiva en lactantes bien seleccionados",
    [
      num("Edad", "age", "días", "45", { min: 0, max: 90, step: "1" }),
      select("Apariencia", "appearance", [["Buen aspecto", "good"], ["Mal aspecto", "ill"]]),
      select("Leucocituria", "urine", [["Ausente", "0"], ["Presente", "1"]]),
      num("Procalcitonina", "pct", "ng/mL", "0.2", { min: 0 }),
      num("Proteína C reactiva", "crp", "mg/L", "10", { min: 0 }),
      num("Neutrófilos absolutos", "anc", "/mm³", "5000", { min: 0 }),
    ],
    (v) => {
      const low = n(v, "age") > 21 && v.appearance === "good" && v.urine === "0" && n(v, "pct") < 0.5 && n(v, "crp") <= 20 && n(v, "anc") <= 10000;
      return { value: low ? "Bajo riesgo por Step-by-Step" : "No bajo riesgo", interpretation: low ? "Cumple todos los pasos de bajo riesgo. Aun así, requiere protocolo por edad, examen, cultivos/observación y seguimiento fiable; no aplicar a neonatos ≤21 días como bajo riesgo." : "Uno o más pasos son positivos: seguir evaluación y manejo de mayor riesgo según edad y protocolo local." };
    },
    "Gómez et al. — Step-by-Step approach validation",
    "https://pubmed.ncbi.nlm.nih.gov/27382134/"
  ),
  "Score de riesgo PIAMA": {
    title: "PIAMA: riesgo de asma en edad escolar",
    subtitle: "Interpreta el total de la ecuación PIAMA validada; se mantienen visibles los ocho predictores originales",
    fields: [
      num("Puntuación PIAMA validada", "score", "0–55", "15", { min: 0, max: 55, step: "1" }),
      ...["Sexo", "Parto posmaduro", "Educación parental", "Uso de medicación inhalada por padres", "Frecuencia de sibilancias", "Sibilancias/disnea fuera de resfriados", "Infecciones respiratorias", "Eccema"].map((label, i) => select(`${label} documentado en la hoja original`, `p${i}`, [["No/ausente", "0"], ["Sí/presente", "1"]])),
    ],
    calculate: (v) => {
      const score = n(v, "score");
      const documented = Array.from({ length: 8 }, (_, i) => v[`p${i}`] === "1").filter(Boolean).length;
      return { value: String(score), unit: "puntos PIAMA", interpretation: `${score >= 20 ? "Riesgo aumentado" : "Por debajo del umbral publicado de 20"}. ${documented}/8 dominios predictores fueron marcados. Use la hoja/ecuación PIAMA validada para obtener el total; no convierta los ocho indicadores en una suma simple.` };
    },
    formula: "Modelo PIAMA publicado (0–55); umbral de cribado ≥20",
    source: "Caudri et al. — PIAMA asthma prediction score",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/19665756/",
  },
  "Score de riesgo de exacerbación asmática": {
    title: "Riesgo validado de exacerbación de asma",
    subtitle: "Interpreta el resultado de la herramienta pediátrica validada de 17 preguntas",
    fields: [num("Puntuación del cuestionario validado", "score", "0–17", "5", { min: 0, max: 17, step: "1" })],
    calculate: (v) => {
      const score = n(v, "score");
      return { value: String(score), unit: "respuestas de riesgo", interpretation: `Mayor puntuación indica mayor probabilidad de exacerbación en los siguientes 6 meses. Registre las 17 respuestas de la versión publicada; no se asigna una categoría terapéutica no validada. Optimice control, técnica, adherencia, exposición y plan de acción según guía.` };
    },
    formula: "Recuento de 17 indicadores del cuestionario validado; sin ponderación inventada",
    source: "Forno et al. — Predicting asthma exacerbations in children",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/20472862/",
  },
  "Riesgo de complicaciones graves en enfermedad de células falciformes": categorical(
    "Predictores tempranos de evolución grave en anemia falciforme",
    "Predictores publicados por Miller et al.; no constituyen una suma terapéutica validada",
    [
      select("Dactilitis antes del año", "dactylitis", [["No", "0"], ["Sí", "1"]]),
      select("Hemoglobina basal <7 g/dL", "hemoglobin", [["No", "0"], ["Sí", "1"]]),
      select("Leucocitosis basal sin infección", "wbc", [["No", "0"], ["Sí", "1"]]),
    ],
    (v) => {
      const total = ["dactylitis", "hemoglobin", "wbc"].reduce((sum, key) => sum + n(v, key), 0);
      return { value: `${total}/3 predictores`, interpretation: `${total ? "Existe al menos un predictor asociado a mayor riesgo en la cohorte original." : "No se identifican estos predictores, pero no se excluyen complicaciones."} No use el recuento como probabilidad individual ni para retirar prevención o seguimiento integral.` };
    },
    "Miller et al. — Prediction of adverse outcomes in children with sickle cell disease",
    "https://pubmed.ncbi.nlm.nih.gov/10631276/"
  ),
});
