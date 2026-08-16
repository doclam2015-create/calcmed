"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Baby,
  Beaker,
  BookOpen,
  Brain,
  Calculator,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Clock3,
  Droplets,
  FlaskConical,
  Heart,
  HeartPulse,
  Home,
  ListFilter,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Sun,
  TestTube2,
  X,
  Zap,
} from "lucide-react";

type ToolKind = "calculator" | "score" | "reference" | "algorithm" | "guide";
type Screen = "home" | "catalog" | "favorites" | "settings";

type ClinicalTool = {
  id: string;
  name: string;
  category: string;
  kind: ToolKind;
  code: string;
  featured?: boolean;
};

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

const categoryMeta: Record<string, { icon: typeof Activity; tint: string }> = {
  "Crecimiento": { icon: Activity, tint: "mint" },
  "Conversiones": { icon: Calculator, tint: "blue" },
  "Renal": { icon: Droplets, tint: "blue" },
  "Embarazo": { icon: CalendarDays, tint: "coral" },
  "Cuidados críticos": { icon: HeartPulse, tint: "coral" },
  "Cardiovascular": { icon: Heart, tint: "coral" },
  "Fármacos": { icon: FlaskConical, tint: "violet" },
  "Fluidos IV": { icon: Droplets, tint: "blue" },
  "Valores sanguíneos": { icon: TestTube2, tint: "violet" },
  "Endocrinología": { icon: Beaker, tint: "amber" },
  "Cirugía": { icon: Stethoscope, tint: "coral" },
  "Polisomnografía": { icon: Moon, tint: "blue" },
  "Neurología": { icon: Brain, tint: "violet" },
  "Gastro y hepatología": { icon: Activity, tint: "amber" },
  "Nutrición": { icon: Sparkles, tint: "mint" },
  "Neonatología": { icon: Baby, tint: "coral" },
  "Dolor": { icon: Activity, tint: "coral" },
  "Reumatología": { icon: Activity, tint: "violet" },
  "Infecciosas": { icon: ShieldCheck, tint: "mint" },
  "Obstetricia": { icon: Baby, tint: "coral" },
  "Respiratorio": { icon: Activity, tint: "blue" },
  "Radiología": { icon: Brain, tint: "violet" },
  "Psicosocial": { icon: Brain, tint: "mint" },
  "Oncología": { icon: ShieldCheck, tint: "coral" },
  "Hematología": { icon: Droplets, tint: "coral" },
};

const catalogSource: Record<string, string[]> = {
  "Crecimiento": [
    "Tasa metabólica basal (BMR)", "Índice de masa corporal (IMC)", "Superficie corporal (BSA)",
    "Circunferencia cefálica", "Talla", "Peso corporal ideal", "Escala de desempeño de Lansky",
    "Talla diana por talla parental", "Predicción de talla", "Peso",
  ],
  "Conversiones": ["Centímetros a pulgadas", "Libras a kilogramos", "Temperatura °C a °F"],
  "Renal": [
    "Brecha aniónica", "Bicarbonato y exceso de base", "Aclaramiento de creatinina", "Aclaramiento de creatinina medido",
    "Aclaramiento de creatinina (Schwartz)", "Aclaramiento de creatinina Cockcroft–Gault", "Excreción fraccional de magnesio",
    "Excreción fraccional de sodio", "Valores normales de TFG", "Criterios RIFLE para lesión renal aguda",
    "Osmolalidad sérica", "Brecha aniónica urinaria", "TFG por fórmula de Schwartz actualizada",
  ],
  "Embarazo": ["Score APGAR", "Fecha de concepción", "Fecha de ovulación", "Fecha probable de parto"],
  "Cuidados críticos": [
    "Gradiente alvéolo-arterial (A-a)", "Algoritmo de dosificación de antiveneno", "Score APACHE II",
    "Gasometría arterial", "Requerimiento de fluidos en quemaduras (Parkland)", "Calcio corregido por hipoalbuminemia",
    "Presión de perfusión cerebral", "QTc corregido", "Profundidad de inserción del tubo endotraqueal",
    "Tamaño del tubo endotraqueal", "Volumen sanguíneo estimado", "Déficit de agua libre en hipernatremia",
    "Ecuación de Henderson–Hasselbalch", "Presión arterial media (PAM)", "Frecuencia respiratoria normal",
    "Pediatric Early Warning Score (PEWS)", "Unidad de cuidados intensivos pediátricos", "Criterios SIRS, sepsis y shock séptico pediátrico",
    "Flujo espiratorio máximo predicho", "Índices predictivos para destete", "Corrección de sodio por hiperglucemia",
    "Déficit de sodio en hiponatremia", "Agua corporal total", "Diuresis y balance hídrico",
  ],
  "Cardiovascular": ["Presión arterial", "Gasto cardíaco (fórmula de Fick)", "Criterios de Duke para endocarditis", "Criterios de Jones para fiebre reumática"],
  "Fármacos": [
    "Dosis antimicrobianas en neonatos", "Score BMQ (Breakpoint to MIC Quotient)", "Equivalentes de calcio",
    "Interacción fármaco–alimento", "Interacciones farmacológicas", "Fármacos a evitar en déficit de G6PD",
    "Calculadora de razón de eficacia", "Fórmula de fármacos de emergencia", "Resistencia intrínseca a fármacos",
    "Conversión a unidades SI", "Conversión de corticoides", "Niveles terapéuticos de fármacos", "Déficit total de hierro",
  ],
  "Fluidos IV": ["Velocidad de flujo", "Tasa de infusión de glucosa (GIR)", "Fluido intravenoso", "Fluidos de mantenimiento", "Gasto energético en reposo"],
  "Valores sanguíneos": [
    "Recuento absoluto de eosinófilos", "Recuento absoluto de linfocitos", "Recuento absoluto de neutrófilos (RAN)",
    "Recuento absoluto de reticulocitos", "Índices hematimétricos", "Química clínica", "Perfil de coagulación",
    "Recuento de reticulocitos corregido", "Determinación del grupo sanguíneo", "Subclases de inmunoglobulina IgG",
    "Valores de referencia de inmunoglobulinas", "Valores de subpoblaciones linfocitarias", "Recuento de subpoblaciones linfocitarias",
    "Valores de referencia del complemento", "Recuento leucocitario",
  ],
  "Endocrinología": [
    "Criterios Dutch para hipercolesterolemia familiar", "Glucosa media estimada desde HbA1c",
    "Estimación de HbA1c desde glucosa media", "Pruebas de función tiroidea", "Criterios MEDPED para hipercolesterolemia familiar",
  ],
  "Cirugía": ["Escala BOPS para dolor posoperatorio pediátrico", "Escala CHEOPS para dolor posoperatorio pediátrico"],
  "Polisomnografía": ["Índice apnea–hipopnea", "Índice de saturación de oxígeno", "Índice de alteración respiratoria (RDI)"],
  "Neurología": [
    "Score de meningitis bacteriana en niños", "Regla CATCH para traumatismo craneal pediátrico",
    "Corrección de leucocitos en LCR por hematíes", "Corrección de proteínas en LCR contaminado con sangre",
    "Escala de coma de Glasgow", "Regla Palchak para traumatismo craneal pediátrico", "Recambio parcial por policitemia neonatal",
    "Algoritmo PECARN para traumatismo craneal pediátrico",
  ],
  "Gastro y hepatología": [
    "Sobredosis de paracetamol y dosificación de NAC", "Nomograma de toxicidad por paracetamol", "Score de Alvarado para apendicitis",
    "Score AIR para apendicitis", "Índice AST/plaquetas (APRI)", "Escala de heces de Bristol", "Score Child–Pugh",
    "Guía EASL para hepatitis B", "Longitud hepática media estimada", "Índice FIB-4 para fibrosis hepática",
    "Score de Glasgow–Blatchford", "Riesgo de carcinoma hepatocelular", "Score IGERQ", "Score simplificado IAIHG",
    "Criterios de Manning para síndrome de intestino irritable", "Score ISHAK en histopatología hepática",
    "Criterios King's College por toxicidad de paracetamol", "Criterios King's College para falla hepática no asociada a paracetamol",
    "Score MELD-Na", "Score Leipzig modificado", "Score de actividad NAFLD", "Valores normales de albúmina",
    "Valores normales de fosfatasa alcalina", "Valores normales de alfafetoproteína", "Valores normales de ALT, AST y GGT",
    "Valores normales de lactato deshidrogenasa", "Valores de ácidos biliares primarios y totales",
    "Índice de actividad de Crohn pediátrico", "Score pediátrico de apendicitis", "Score de fibrosis NAFLD pediátrico",
    "Score histológico NAFLD pediátrico", "Índice de actividad de colitis ulcerosa pediátrica (PUCAI)", "PELD",
    "PRETEXT factor P", "PRETEXT factor V", "PRETEXT factores E, F, R, C, N y M", "PRETEXT para hepatoblastoma",
    "Criterios de enfermedad hepática autoinmune juvenil", "Reflux Finding Score", "Reflux Symptom Index",
    "Índice de actividad de rechazo", "Score Rockall para sangrado digestivo alto", "Score Rockall completo",
    "Roma IV para migraña abdominal", "Roma IV para aerofagia", "Roma IV para estreñimiento",
    "Roma IV para síndrome de vómitos cíclicos", "Roma IV para dolor abdominal funcional", "Roma IV para dispepsia funcional",
    "Roma IV para náusea y vómito funcional", "Roma IV para síndrome de intestino irritable",
    "Roma IV para incontinencia fecal no retentiva", "Roma IV para síndrome de rumiación",
    "Severidad de pancreatitis aguda", "Score para infección respiratoria baja", "Gradiente albúmina suero–ascitis (GASA)",
    "Brecha osmolar fecal", "Longitud esplénica normal por ecografía", "Índice de Wilson para mortalidad",
    "Score Leipzig para enfermedad de Wilson",
  ],
  "Nutrición": [
    "Valor biológico de alimentos", "Ingestas dietéticas de referencia", "Composición de leche humana por período posparto",
    "Valores nutricionales de frutas", "Requerimientos de proteínas por edad", "Ingesta diaria recomendada de vitaminas y minerales",
  ],
  "Neonatología": [
    "Score de Ballard", "Criterios BRUE en lactantes", "Nomograma de riesgo de hiperbilirrubinemia",
    "Dosis de inmunoglobulina anti-D por hemorragia materno-fetal", "Surfactante porcino natural", "Nomograma de fototerapia",
    "Colocación de catéter arterial umbilical", "Colocación de catéter venoso umbilical",
  ],
  "Dolor": ["Escala de dolor FLACC"],
  "Reumatología": [
    "Criterios ACR/EULAR para gota", "Espondilitis anquilosante", "Anticuerpos y enfermedades asociadas",
    "Índice BASDAI", "Score global BAS-G", "Criterios internacionales para enfermedad de Behçet",
    "Criterios para granulomatosis eosinofílica con poliangeítis", "Criterios EULAR para lupus eritematoso sistémico",
    "Calculadora diagnóstica de fibromialgia", "Arteritis de células gigantes", "TFG por Schwartz",
    "TFG por Schwartz actualizada", "Granulomatosis con poliangeítis", "Criterios de púrpura de Henoch–Schönlein",
    "Calculadora de enfermedad ósea pediátrica", "Poliarteritis nodosa", "Esclerodermia", "Síndrome de Sjögren", "Índice SLEDAI",
  ],
  "Infecciosas": [
    "Score Centor/McIsaac para faringitis estreptocócica", "Score FeverPAIN", "Criterios diagnósticos de Kawasaki",
    "Criterios de Kocher para artritis séptica", "Criterios de Rochester para lactantes febriles", "Regla de 7 para meningitis de Lyme",
    "Abordaje paso a paso del lactante febril", "Score SILC para carditis de Lyme", "Score Westley para crup",
  ],
  "Obstetricia": ["Score de Bishop para inducción del parto", "Riesgo VBAC para parto vaginal exitoso"],
  "Respiratorio": [
    "Índice predictivo de asma (API)", "Valores predichos de FEV1", "Índice predictivo de asma modificado (mAPI)",
    "Score pediátrico de asma (PAS)", "Score de severidad de asma pediátrica (PASS)", "Medida PRAM para exacerbación de asma",
    "Predicción PEFR/FVC/FEF50/FEF75", "Score de riesgo PIAMA", "Score de riesgo de exacerbación asmática",
  ],
  "Radiología": ["Score de Eckhardt", "Instrumento NEXUS II pediátrico para decisión de TC de cráneo"],
  "Psicosocial": [
    "Criterios DSM-5 para anorexia nerviosa", "Criterios DSM-5 para TDAH", "Criterios DSM-5 para ARFID",
    "Criterios DSM-5 para trastorno por atracón", "Criterios DSM-5 para dismorfia corporal", "Criterios DSM-5 para bulimia nerviosa",
    "Criterios DSM-5 para trastorno de conducta", "Criterios DSM-5 para desregulación disruptiva del ánimo",
    "Criterios DSM-5 para trastorno depresivo persistente", "Criterios DSM-5 para ansiedad generalizada",
    "Criterios DSM-5 para episodio depresivo mayor", "Criterios DSM-5 para episodio maníaco",
    "Criterios DSM-5 para trastorno negativista desafiante", "Criterios DSM-5 para pánico y agorafobia",
    "Criterios DSM-5 para estrés postraumático en menores de 6 años", "Criterios DSM-5 para ansiedad por separación",
    "Criterios DSM-5 para trastorno de comunicación social", "Criterios DSM-5 para ansiedad social",
  ],
  "Oncología": [
    "Score pronóstico internacional de Hodgkin infantil (CHIPS)", "Algoritmo de interpretación de espirometría",
    "Toronto: estadificación de leucemia linfoblástica aguda", "Toronto: estadificación de leucemia mieloide aguda",
    "Toronto: estadificación de ependimoma", "Toronto: estadificación de sarcoma de Ewing",
    "Toronto: estadificación de hepatoblastoma", "Toronto: estadificación de linfoma de Hodgkin",
    "Toronto: estadificación de meduloblastoma y tumores embrionarios SNC", "Toronto: estadificación de neuroblastoma",
    "Toronto: estadificación de linfoma no Hodgkin", "Toronto: sarcoma de partes blandas no rabdomiosarcoma",
    "Toronto: estadificación de osteosarcoma", "Toronto: estadificación de cáncer de ovario",
    "Toronto: estadificación de retinoblastoma", "Toronto: estadificación de rabdomiosarcoma",
    "Toronto: estadificación de cáncer testicular", "Toronto: estadificación de tumor de Wilms",
  ],
  "Hematología": [
    "Cálculo de volumen sanguíneo", "Dosis de crioprecipitado para reposición de fibrinógeno",
    "Volumen de infusión de linfocitos del donante (DLI)", "Índice de Mentzer para talasemia",
    "Riesgo de complicaciones graves en enfermedad de células falciformes", "Volumen de recambio eritrocitario en enfermedad falciforme",
  ],
};

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function inferKind(name: string): ToolKind {
  if (calculators[name]) return "calculator";
  if (scores[name]) return "score";
  if (referenceDefinitions[name]) return "reference";
  const lower = name.toLowerCase();
  if (lower.includes("valores") || lower.includes("frecuencia normal") || lower.includes("ingesta") || lower.includes("requerimientos")) return "reference";
  if (lower.includes("algoritmo") || lower.includes("guía") || lower.includes("interacción") || lower.includes("abordaje") || lower.includes("colocación")) return "algorithm";
  return "guide";
}

const featuredNames = new Set([
  "Índice de masa corporal (IMC)", "Superficie corporal (BSA)", "Aclaramiento de creatinina Cockcroft–Gault",
  "Presión arterial media (PAM)", "Score APGAR", "Escala de coma de Glasgow", "Score Child–Pugh",
  "Score MELD-Na", "Fluidos de mantenimiento", "Score Centor/McIsaac para faringitis estreptocócica",
  "Score de Bishop para inducción del parto", "Recuento absoluto de neutrófilos (RAN)",
]);

const n = (v: Record<string, string>, key: string) => Number(v[key]);
const num = (label: string, key: string, unit: string, placeholder: string, extra: Partial<Field> = {}): Field => ({ label, key, unit, placeholder, type: "number", step: "any", ...extra });
const sexField: Field = { key: "sex", label: "Sexo biológico", type: "select", options: [{ label: "Masculino", value: "m" }, { label: "Femenino", value: "f" }] };
const yesNo = (label: string, key: string): Field => ({ key, label, type: "select", options: [{ label: "No", value: "no" }, { label: "Sí", value: "yes" }] });

const steroidEquivalents = {
  hydrocortisone: { label: "Hidrocortisona", dose: 20, duration: "8–12 h" },
  cortisone: { label: "Cortisona", dose: 25, duration: "8–12 h" },
  prednisone: { label: "Prednisona", dose: 5, duration: "12–36 h" },
  prednisolone: { label: "Prednisolona", dose: 5, duration: "12–36 h" },
  methylprednisolone: { label: "Metilprednisolona", dose: 4, duration: "12–36 h" },
  triamcinolone: { label: "Triamcinolona", dose: 4, duration: "12–36 h" },
  dexamethasone: { label: "Dexametasona", dose: 0.75, duration: "36–54 h" },
  betamethasone: { label: "Betametasona", dose: 0.75, duration: "36–54 h" },
} as const;

const steroidOptions = Object.entries(steroidEquivalents).map(([value, item]) => ({ label: item.label, value }));

const calculators: Record<string, CalcDefinition> = {
  "Conversión de corticoides": {
    title: "Conversión de corticoides sistémicos",
    subtitle: "Equivalencia antiinflamatoria aproximada entre glucocorticoides",
    fields: [
      { key: "source", label: "Corticoide de origen", type: "select", options: steroidOptions },
      num("Dosis de origen", "dose", "mg", "5", { min: 0, step: "0.01" }),
      { key: "target", label: "Corticoide de destino", type: "select", options: steroidOptions },
    ],
    calculate: (v) => {
      const source = steroidEquivalents[v.source as keyof typeof steroidEquivalents];
      const target = steroidEquivalents[v.target as keyof typeof steroidEquivalents];
      const inputDose = n(v, "dose");
      if (!source || !target || inputDose < 0) return { value: "—", interpretation: "Selecciona preparados válidos e ingresa una dosis no negativa." };
      const equivalent = inputDose / source.dose * target.dose;
      const hydrocortisoneEquivalent = inputDose / source.dose * steroidEquivalents.hydrocortisone.dose;
      return {
        value: equivalent < 1 ? equivalent.toFixed(3) : equivalent.toFixed(2),
        unit: "mg de " + target.label,
        interpretation: `${inputDose} mg de ${source.label} equivalen aproximadamente a ${equivalent.toFixed(2)} mg de ${target.label}. Equivalente de hidrocortisona: ${hydrocortisoneEquivalent.toFixed(2)} mg. Duración biológica orientativa: ${source.duration} → ${target.duration}. No usar esta conversión para decidir pauta, vía, frecuencia ni retirada gradual.`,
      };
    },
    formula: "dosis destino = dosis origen ÷ dosis equivalente origen × dosis equivalente destino",
    source: "NIH/NLM LiverTox — dosis glucocorticoides sistémicas equivalentes",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK548400/",
  },
  "Índice de masa corporal (IMC)": {
    title: "Índice de masa corporal", subtitle: "Clasificación de IMC en adultos", fields: [num("Peso", "weight", "kg", "70", { min: 1 }), num("Talla", "height", "cm", "170", { min: 30 })],
    calculate: (v) => { const bmi = n(v, "weight") / ((n(v, "height") / 100) ** 2); const interpretation = bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Rango saludable" : bmi < 30 ? "Sobrepeso" : bmi < 35 ? "Obesidad clase I" : bmi < 40 ? "Obesidad clase II" : "Obesidad clase III"; return { value: bmi.toFixed(1), unit: "kg/m²", interpretation }; },
    formula: "peso (kg) / talla² (m)", source: "CDC — cálculo e interpretación de IMC adulto", sourceUrl: "https://www.cdc.gov/bmi/es/adult-calculator/index.html",
  },
  "Superficie corporal (BSA)": {
    title: "Superficie corporal", subtitle: "Fórmula de Mosteller", fields: [num("Peso", "weight", "kg", "70", { min: 1 }), num("Talla", "height", "cm", "170", { min: 30 })],
    calculate: (v) => { const bsa = Math.sqrt((n(v, "weight") * n(v, "height")) / 3600); return { value: bsa.toFixed(2), unit: "m²", interpretation: "Superficie corporal estimada" }; },
    formula: "√[(talla × peso) / 3600]", source: "Fórmula de Mosteller; verifique el protocolo de dosificación local",
  },
  "Tasa metabólica basal (BMR)": {
    title: "Tasa metabólica basal", subtitle: "Ecuación de Mifflin–St Jeor", fields: [sexField, num("Edad", "age", "años", "35"), num("Peso", "weight", "kg", "70"), num("Talla", "height", "cm", "170")],
    calculate: (v) => { const bmr = 10 * n(v, "weight") + 6.25 * n(v, "height") - 5 * n(v, "age") + (v.sex === "m" ? 5 : -161); return { value: Math.round(bmr).toString(), unit: "kcal/día", interpretation: "Gasto basal estimado en reposo" }; },
    formula: "10P + 6,25T − 5E + factor sexual", source: "Ecuación de Mifflin–St Jeor; estimación orientativa",
  },
  "Brecha aniónica": {
    title: "Brecha aniónica", subtitle: "Evaluación ácido–base", fields: [num("Sodio", "na", "mmol/L", "140"), num("Cloro", "cl", "mmol/L", "104"), num("Bicarbonato", "hco3", "mmol/L", "24")],
    calculate: (v) => { const ag = n(v, "na") - n(v, "cl") - n(v, "hco3"); return { value: ag.toFixed(1), unit: "mmol/L", interpretation: ag > 12 ? "Elevada: correlacionar con albúmina y contexto clínico" : ag < 8 ? "Baja: revisar albúmina, medición y causas asociadas" : "Dentro del intervalo habitual (dependiente del laboratorio)" }; },
    formula: "Na − (Cl + HCO₃)", source: "Intervalos dependientes del método y laboratorio",
  },
  "Aclaramiento de creatinina Cockcroft–Gault": {
    title: "Aclaramiento de creatinina", subtitle: "Ecuación de Cockcroft–Gault", fields: [sexField, num("Edad", "age", "años", "60"), num("Peso", "weight", "kg", "70"), num("Creatinina sérica", "scr", "mg/dL", "1.0")],
    calculate: (v) => { let crcl = ((140 - n(v, "age")) * n(v, "weight")) / (72 * n(v, "scr")); if (v.sex === "f") crcl *= 0.85; return { value: crcl.toFixed(1), unit: "mL/min", interpretation: "Estimación para ajuste farmacológico; valide peso y estabilidad de creatinina" }; },
    formula: "[(140 − edad) × peso] / (72 × Cr); ×0,85 en mujer", source: "Cockcroft–Gault; no equivale a eGFR normalizada",
  },
  "TFG por Schwartz actualizada": {
    title: "TFG pediátrica estimada", subtitle: "Schwartz actualizada (bedside)", fields: [num("Talla", "height", "cm", "120"), num("Creatinina sérica", "scr", "mg/dL", "0.6")],
    calculate: (v) => { const egfr = 0.413 * n(v, "height") / n(v, "scr"); return { value: egfr.toFixed(1), unit: "mL/min/1,73 m²", interpretation: "Estimación pediátrica; interpretar con edad, masa muscular y tendencia" }; },
    formula: "0,413 × talla (cm) / creatinina (mg/dL)", source: "Ecuación bedside Schwartz pediátrica",
  },
  "Osmolalidad sérica": {
    title: "Osmolalidad sérica calculada", subtitle: "Convención con unidades mg/dL", fields: [num("Sodio", "na", "mmol/L", "140"), num("Glucosa", "glucose", "mg/dL", "90"), num("BUN", "bun", "mg/dL", "14")],
    calculate: (v) => { const osm = 2 * n(v, "na") + n(v, "glucose") / 18 + n(v, "bun") / 2.8; return { value: osm.toFixed(1), unit: "mOsm/kg", interpretation: "Compare con osmolalidad medida para calcular brecha osmolar" }; },
    formula: "2Na + glucosa/18 + BUN/2,8", source: "Fórmula convencional; la inclusión de potasio varía por centro",
  },
  "Presión arterial media (PAM)": {
    title: "Presión arterial media", subtitle: "Estimación a partir de PAS/PAD", fields: [num("Presión sistólica", "sbp", "mmHg", "120"), num("Presión diastólica", "dbp", "mmHg", "70")],
    calculate: (v) => { const map = (n(v, "sbp") + 2 * n(v, "dbp")) / 3; return { value: map.toFixed(0), unit: "mmHg", interpretation: map < 65 ? "Baja en un adulto crítico; interpretar en contexto y según objetivo individual" : "Estimación hemodinámica" }; },
    formula: "(PAS + 2 × PAD) / 3", source: "Estimación válida principalmente a frecuencia cardíaca regular",
  },
  "Calcio corregido por hipoalbuminemia": {
    title: "Calcio corregido", subtitle: "Corrección convencional por albúmina", fields: [num("Calcio total", "ca", "mg/dL", "8.0"), num("Albúmina", "albumin", "g/dL", "3.0")],
    calculate: (v) => { const ca = n(v, "ca") + 0.8 * (4 - n(v, "albumin")); return { value: ca.toFixed(2), unit: "mg/dL", interpretation: "Considere calcio ionizado si la decisión clínica depende del resultado" }; },
    formula: "Ca medido + 0,8 × (4 − albúmina)", source: "Corrección convencional; precisión limitada en enfermedad crítica",
  },
  "Corrección de sodio por hiperglucemia": {
    title: "Sodio corregido por glucosa", subtitle: "Factor convencional 1,6 mEq/L", fields: [num("Sodio medido", "na", "mEq/L", "130"), num("Glucosa", "glucose", "mg/dL", "400")],
    calculate: (v) => { const corrected = n(v, "na") + 1.6 * Math.max(0, (n(v, "glucose") - 100) / 100); return { value: corrected.toFixed(1), unit: "mEq/L", interpretation: "Use la tendencia y el contexto; algunos protocolos emplean factor 2,4" }; },
    formula: "Na + 1,6 × [(glucosa − 100) / 100]", source: "Factor 1,6 convencional; revise protocolo institucional",
  },
  "Fluidos de mantenimiento": {
    title: "Fluidos pediátricos de mantenimiento", subtitle: "Reglas 4–2–1 y 100–50–20", fields: [num("Peso", "weight", "kg", "18", { min: 0.1 })],
    calculate: (v) => { const w = n(v, "weight"); const hourly = w <= 10 ? 4 * w : w <= 20 ? 40 + 2 * (w - 10) : 60 + (w - 20); const daily = w <= 10 ? 100 * w : w <= 20 ? 1000 + 50 * (w - 10) : 1500 + 20 * (w - 20); return { value: hourly.toFixed(0), unit: "mL/h", interpretation: daily.toFixed(0) + " mL/día. Ajustar a clínica, electrolitos y pérdidas." }; },
    formula: "4–2–1 mL/kg/h; 100–50–20 mL/kg/día", source: "Mantenimiento teórico; no sustituye balance ni reposición de pérdidas",
  },
  "Tasa de infusión de glucosa (GIR)": {
    title: "Tasa de infusión de glucosa", subtitle: "GIR neonatal/pediátrica", fields: [num("Dextrosa", "dextrose", "%", "10"), num("Volumen", "volume", "mL/kg/día", "100")],
    calculate: (v) => { const gir = n(v, "dextrose") * n(v, "volume") / 144; return { value: gir.toFixed(2), unit: "mg/kg/min", interpretation: "Verifique concentración final, vía y monitorización de glucemia" }; },
    formula: "% dextrosa × mL/kg/día ÷ 144", source: "Conversión estándar de aporte de glucosa",
  },
  "Recuento absoluto de neutrófilos (RAN)": {
    title: "Recuento absoluto de neutrófilos", subtitle: "RAN / ANC", fields: [num("Leucocitos", "wbc", "/µL", "5000"), num("Neutrófilos", "neut", "%", "50"), num("Bandas", "bands", "%", "2")],
    calculate: (v) => { const anc = n(v, "wbc") * (n(v, "neut") + n(v, "bands")) / 100; return { value: Math.round(anc).toString(), unit: "/µL", interpretation: anc < 500 ? "Neutropenia grave" : anc < 1000 ? "Neutropenia moderada" : anc < 1500 ? "Neutropenia leve" : "Sin neutropenia por umbral adulto habitual" }; },
    formula: "leucocitos × (% neutrófilos + % bandas) / 100", source: "Los umbrales dependen de edad, población y contexto",
  },
  "Índice AST/plaquetas (APRI)": {
    title: "Índice APRI", subtitle: "Estimación no invasiva de fibrosis", fields: [num("AST", "ast", "U/L", "60"), num("Límite superior AST", "uln", "U/L", "40"), num("Plaquetas", "platelets", "10³/µL", "180")],
    calculate: (v) => { const apri = (n(v, "ast") / n(v, "uln")) * 100 / n(v, "platelets"); return { value: apri.toFixed(2), interpretation: apri < 0.5 ? "Bajo; la interpretación depende de etiología y corte" : apri > 1.5 ? "Elevado; requiere evaluación clínica" : "Zona intermedia" }; },
    formula: "(AST / LSN AST) × 100 / plaquetas", source: "No usar de forma aislada para decisiones diagnósticas",
  },
  "Índice FIB-4 para fibrosis hepática": {
    title: "Índice FIB-4", subtitle: "Estimación no invasiva de fibrosis", fields: [num("Edad", "age", "años", "55"), num("AST", "ast", "U/L", "45"), num("ALT", "alt", "U/L", "50"), num("Plaquetas", "platelets", "10³/µL", "180")],
    calculate: (v) => { const fib = n(v, "age") * n(v, "ast") / (n(v, "platelets") * Math.sqrt(n(v, "alt"))); return { value: fib.toFixed(2), interpretation: fib < 1.3 ? "Bajo riesgo por corte habitual" : fib > 2.67 ? "Alto riesgo por corte habitual" : "Riesgo indeterminado; considere segunda prueba" }; },
    formula: "edad × AST / [plaquetas × √ALT]", source: "Los puntos de corte cambian con edad y etiología",
  },
  "Score MELD-Na": {
    title: "Score MELD-Na", subtitle: "Estimación basada en bilirrubina, INR, creatinina y sodio", fields: [num("Bilirrubina total", "bilirubin", "mg/dL", "2"), num("INR", "inr", "", "1.4"), num("Creatinina", "creatinine", "mg/dL", "1.2"), num("Sodio", "sodium", "mmol/L", "135"), { key: "dialysis", label: "Diálisis ≥2 veces en 7 días", type: "select", options: [{ label: "No", value: "no" }, { label: "Sí", value: "yes" }] }],
    calculate: (v) => { const bili = Math.max(1, n(v, "bilirubin")); const inr = Math.max(1, n(v, "inr")); const creat = v.dialysis === "yes" ? 4 : Math.min(4, Math.max(1, n(v, "creatinine"))); const na = Math.min(137, Math.max(125, n(v, "sodium"))); const meld = 3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 9.57 * Math.log(creat) + 6.43; const meldNa = Math.min(40, Math.max(6, meld + 1.32 * (137 - na) - 0.033 * meld * (137 - na))); return { value: Math.round(meldNa).toString(), unit: "puntos", interpretation: "Use la política vigente del sistema de trasplante; MELD 3.0 emplea variables adicionales" }; },
    formula: "MELD(i) + 1,32(137−Na) − 0,033×MELD(i)×(137−Na)", source: "MELD-Na clásico; límites aplicados Na 125–137, creatinina 1–4 y score 6–40",
  },
  "Índice de Mentzer para talasemia": {
    title: "Índice de Mentzer", subtitle: "Orientación en microcitosis", fields: [num("VCM", "mcv", "fL", "68"), num("Eritrocitos", "rbc", "millones/µL", "5.4")],
    calculate: (v) => { const value = n(v, "mcv") / n(v, "rbc"); return { value: value.toFixed(1), interpretation: value < 13 ? "Patrón más compatible con rasgo talasémico" : "Patrón más compatible con ferropenia; confirmar estudios" }; },
    formula: "VCM / recuento de eritrocitos", source: "Herramienta de cribado; no confirma etiología",
  },
  "Déficit total de hierro": {
    title: "Déficit total de hierro", subtitle: "Fórmula de Ganzoni", fields: [num("Peso", "weight", "kg", "70"), num("Hb actual", "hb", "g/dL", "8.5"), num("Hb objetivo", "target", "g/dL", "13")],
    calculate: (v) => { const deficit = n(v, "weight") * (n(v, "target") - n(v, "hb")) * 2.4 + 500; return { value: Math.max(0, Math.round(deficit)).toString(), unit: "mg", interpretation: "Incluye 500 mg para depósitos en adultos; individualice y respete ficha técnica" }; },
    formula: "peso × (Hb objetivo − Hb actual) × 2,4 + depósitos", source: "Fórmula de Ganzoni; verifique preparación y dosis máxima",
  },
  "Fecha probable de parto": {
    title: "Fecha probable de parto", subtitle: "Regla de Näegele (FUR + 280 días)", fields: [{ key: "date", label: "Fecha de última regla", type: "date" }],
    calculate: (v) => { const d = new Date(v.date + "T12:00:00"); d.setDate(d.getDate() + 280); return { value: Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" }), interpretation: "Estimación por FUR; confirmar con ecografía según práctica obstétrica" }; },
    formula: "FUR + 280 días", source: "Estimación obstétrica; ajustar por longitud del ciclo y ecografía",
  },
  "Centímetros a pulgadas": {
    title: "Centímetros a pulgadas", subtitle: "Conversión lineal", fields: [num("Centímetros", "cm", "cm", "170")],
    calculate: (v) => ({ value: (n(v, "cm") / 2.54).toFixed(2), unit: "in", interpretation: "1 pulgada = 2,54 cm" }), formula: "cm / 2,54", source: "Conversión SI",
  },
  "Libras a kilogramos": {
    title: "Libras a kilogramos", subtitle: "Conversión de masa", fields: [num("Libras", "lb", "lb", "154")],
    calculate: (v) => ({ value: (n(v, "lb") * 0.45359237).toFixed(2), unit: "kg", interpretation: "Conversión exacta por factor internacional" }), formula: "lb × 0,45359237", source: "Conversión SI",
  },
  "Temperatura °C a °F": {
    title: "Conversor de temperatura", subtitle: "Celsius a Fahrenheit", fields: [num("Temperatura", "c", "°C", "37")],
    calculate: (v) => ({ value: (n(v, "c") * 9 / 5 + 32).toFixed(1), unit: "°F", interpretation: "Conversión matemática" }), formula: "°F = °C × 9/5 + 32", source: "Conversión de temperatura",
  },
  "Peso corporal ideal": {
    title: "Peso corporal ideal", subtitle: "Fórmula de Devine en adultos", fields: [sexField, num("Talla", "height", "cm", "170", { min: 120 })],
    calculate: (v) => { const inches = n(v, "height") / 2.54; const ibw = (v.sex === "m" ? 50 : 45.5) + 2.3 * Math.max(0, inches - 60); return { value: ibw.toFixed(1), unit: "kg", interpretation: "Estimación adulta; no representa un objetivo nutricional individual" }; },
    formula: "base sexual + 2,3 kg por pulgada sobre 5 pies", source: "Fórmula de Devine; uso farmacocinético orientativo",
  },
  "Talla diana por talla parental": {
    title: "Talla diana familiar", subtitle: "Estimación por talla media parental", fields: [sexField, num("Talla materna", "mother", "cm", "162"), num("Talla paterna", "father", "cm", "175")],
    calculate: (v) => { const target = (n(v, "mother") + n(v, "father") + (v.sex === "m" ? 13 : -13)) / 2; return { value: target.toFixed(1), unit: "cm", interpretation: "Rango diana aproximado: " + (target - 8.5).toFixed(1) + " a " + (target + 8.5).toFixed(1) + " cm" }; },
    formula: "(talla materna + talla paterna ± 13) / 2", source: "Estimación auxológica; evaluar velocidad de crecimiento y curva poblacional",
  },
  "Aclaramiento de creatinina medido": {
    title: "Aclaramiento de creatinina medido", subtitle: "Recolección urinaria temporizada", fields: [num("Creatinina urinaria", "ucr", "mg/dL", "100"), num("Volumen urinario", "volume", "mL", "1500"), num("Creatinina sérica", "scr", "mg/dL", "1"), num("Duración", "minutes", "min", "1440")],
    calculate: (v) => { const crcl = n(v, "ucr") * n(v, "volume") / (n(v, "scr") * n(v, "minutes")); return { value: crcl.toFixed(1), unit: "mL/min", interpretation: "Resultado no normalizado por superficie corporal; confirme calidad de la recolección" }; },
    formula: "Cr urinaria × volumen / (Cr sérica × minutos)", source: "Clearance urinario medido; interpretar con recolección completa",
  },
  "Excreción fraccional de sodio": {
    title: "Excreción fraccional de sodio", subtitle: "FENa", fields: [num("Sodio urinario", "una", "mmol/L", "20"), num("Creatinina sérica", "scr", "mg/dL", "1.5"), num("Sodio sérico", "sna", "mmol/L", "140"), num("Creatinina urinaria", "ucr", "mg/dL", "100")],
    calculate: (v) => { const fena = n(v, "una") * n(v, "scr") * 100 / (n(v, "sna") * n(v, "ucr")); return { value: fena.toFixed(2), unit: "%", interpretation: fena < 1 ? "Valor bajo; puede sugerir retención tubular de sodio, con limitaciones clínicas" : "Valor ≥1%; interpretar según diuréticos, sepsis, ERC y contexto" }; },
    formula: "(NaU × CrS) / (NaS × CrU) × 100", source: "Índice complementario; no discrimina por sí solo la etiología de LRA",
  },
  "Brecha aniónica urinaria": {
    title: "Brecha aniónica urinaria", subtitle: "Estimación indirecta de excreción de amonio", fields: [num("Sodio urinario", "una", "mmol/L", "40"), num("Potasio urinario", "uk", "mmol/L", "25"), num("Cloro urinario", "ucl", "mmol/L", "80")],
    calculate: (v) => { const uag = n(v, "una") + n(v, "uk") - n(v, "ucl"); return { value: uag.toFixed(1), unit: "mmol/L", interpretation: uag < 0 ? "Negativa: compatible con mayor excreción de NH₄⁺ en el contexto apropiado" : "Positiva: posible excreción reducida de NH₄⁺; revisar limitaciones" }; },
    formula: "NaU + KU − ClU", source: "Estimación indirecta; no usar con aniones urinarios no medidos importantes",
  },
  "Fecha de concepción": {
    title: "Fecha estimada de concepción", subtitle: "Estimación desde la fecha de última regla", fields: [{ key: "date", label: "Fecha de última regla", type: "date" }, num("Duración habitual del ciclo", "cycle", "días", "28")],
    calculate: (v) => { const d = new Date(v.date + "T12:00:00"); d.setDate(d.getDate() + n(v, "cycle") - 14); return { value: Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" }), interpretation: "Estimación; la fecundación real puede variar varios días" }; },
    formula: "FUR + duración del ciclo − 14 días", source: "Estimación calendárica; confirmar datación obstétrica cuando corresponda",
  },
  "Fecha de ovulación": {
    title: "Fecha estimada de ovulación", subtitle: "Estimación según duración del ciclo", fields: [{ key: "date", label: "Primer día de la última regla", type: "date" }, num("Duración habitual del ciclo", "cycle", "días", "28")],
    calculate: (v) => { const d = new Date(v.date + "T12:00:00"); d.setDate(d.getDate() + n(v, "cycle") - 14); return { value: Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" }), interpretation: "Estimación poblacional; no confirma ovulación" }; },
    formula: "FUR + duración del ciclo − 14 días", source: "Método calendárico; ciclos irregulares reducen precisión",
  },
  "Gradiente alvéolo-arterial (A-a)": {
    title: "Gradiente alvéolo–arterial", subtitle: "Ecuación del gas alveolar", fields: [num("FiO₂", "fio2", "fracción", "0.21"), num("Presión barométrica", "patm", "mmHg", "760"), num("PaCO₂", "paco2", "mmHg", "40"), num("PaO₂", "pao2", "mmHg", "90"), num("Cociente respiratorio", "rq", "", "0.8")],
    calculate: (v) => { const pao2Alv = n(v, "fio2") * (n(v, "patm") - 47) - n(v, "paco2") / n(v, "rq"); const gradient = pao2Alv - n(v, "pao2"); return { value: gradient.toFixed(1), unit: "mmHg", interpretation: "PAO₂ estimada: " + pao2Alv.toFixed(1) + " mmHg. Ajuste por edad, FiO₂ y altitud." }; },
    formula: "A–a = FiO₂(Patm−47) − PaCO₂/R − PaO₂", source: "Ecuación del gas alveolar; use gases simultáneos y presión barométrica local",
  },
  "Requerimiento de fluidos en quemaduras (Parkland)": {
    title: "Reanimación inicial en quemaduras", subtitle: "Fórmula de Parkland", fields: [num("Peso", "weight", "kg", "70"), num("Superficie corporal quemada", "tbsa", "%", "30", { min: 0, max: 100 })],
    calculate: (v) => { const total = 4 * n(v, "weight") * n(v, "tbsa"); return { value: Math.round(total).toString(), unit: "mL/24 h", interpretation: "Primeras 8 h desde la quemadura: " + Math.round(total / 2) + " mL; titular a respuesta y diuresis" }; },
    formula: "4 mL × kg × %SCQ", source: "Parkland es un punto de partida; evitar sobrecarga y seguir protocolo de quemados",
  },
  "Presión de perfusión cerebral": {
    title: "Presión de perfusión cerebral", subtitle: "Relación entre PAM y presión intracraneal", fields: [num("Presión arterial media", "map", "mmHg", "85"), num("Presión intracraneal", "icp", "mmHg", "15")],
    calculate: (v) => { const cpp = n(v, "map") - n(v, "icp"); return { value: cpp.toFixed(0), unit: "mmHg", interpretation: "Individualice el objetivo según edad, lesión y protocolo neurocrítico" }; },
    formula: "PPC = PAM − PIC", source: "Relación hemodinámica; requiere mediciones confiables y contemporáneas",
  },
  "QTc corregido": {
    title: "Intervalo QT corregido", subtitle: "Bazett o Fridericia", fields: [{ key: "method", label: "Método", type: "select", options: [{ label: "Bazett", value: "bazett" }, { label: "Fridericia", value: "fridericia" }] }, num("QT", "qt", "ms", "400"), num("RR", "rr", "ms", "800")],
    calculate: (v) => { const rr = n(v, "rr") / 1000; const qtc = v.method === "fridericia" ? n(v, "qt") / Math.cbrt(rr) : n(v, "qt") / Math.sqrt(rr); return { value: qtc.toFixed(0), unit: "ms", interpretation: "Interpretar según sexo, edad, frecuencia, QRS y contexto; revisar medición manual" }; },
    formula: "Bazett: QT/√RR · Fridericia: QT/∛RR", source: "Fórmulas estándar; Fridericia suele comportarse mejor en frecuencias extremas",
  },
  "Tamaño del tubo endotraqueal": {
    title: "Tamaño estimado de tubo endotraqueal", subtitle: "Aproximación pediátrica por edad", fields: [{ key: "cuff", label: "Tipo de tubo", type: "select", options: [{ label: "Con cuff", value: "cuffed" }, { label: "Sin cuff", value: "uncuffed" }] }, num("Edad", "age", "años", "4", { min: 1 })],
    calculate: (v) => { const size = n(v, "age") / 4 + (v.cuff === "cuffed" ? 3.5 : 4); return { value: size.toFixed(1), unit: "mm DI", interpretation: "Prepare además tubos 0,5 mm menor y mayor; confirme fuga, presión de cuff y clínica" }; },
    formula: "edad/4 + 3,5 (con cuff) o +4 (sin cuff)", source: "Aproximación pediátrica; no sustituye selección neonatal ni evaluación anatómica",
  },
  "Profundidad de inserción del tubo endotraqueal": {
    title: "Profundidad oral estimada del TET", subtitle: "Aproximación pediátrica por edad", fields: [num("Edad", "age", "años", "4", { min: 1 })],
    calculate: (v) => ({ value: (n(v, "age") / 2 + 12).toFixed(1), unit: "cm", interpretation: "Confirmar siempre con capnografía, auscultación e imagen cuando corresponda" }),
    formula: "edad/2 + 12 cm (vía oral)", source: "Aproximación pediátrica; no aplicable como regla única en neonatos",
  },
  "Volumen sanguíneo estimado": {
    title: "Volumen sanguíneo estimado", subtitle: "Estimación por peso y grupo etario", fields: [{ key: "group", label: "Grupo", type: "select", options: [{ label: "Prematuro (95 mL/kg)", value: "95" }, { label: "Recién nacido (85 mL/kg)", value: "85" }, { label: "Niño (75 mL/kg)", value: "75" }, { label: "Adulto (70 mL/kg)", value: "70" }, { label: "Adulta (65 mL/kg)", value: "65" }] }, num("Peso", "weight", "kg", "20")],
    calculate: (v) => { const volume = Number(v.group) * n(v, "weight"); return { value: Math.round(volume).toString(), unit: "mL", interpretation: "Estimación poblacional; ajuste al contexto clínico y protocolo transfusional" }; },
    formula: "peso × factor etario/sexual", source: "Factores aproximados de volumen sanguíneo por kg",
  },
  "Déficit de agua libre en hipernatremia": {
    title: "Déficit de agua libre", subtitle: "Estimación en hipernatremia", fields: [{ key: "factor", label: "Factor de agua corporal total", type: "select", options: [{ label: "Varón adulto 0,6", value: "0.6" }, { label: "Mujer adulta 0,5", value: "0.5" }, { label: "Persona mayor/frágil 0,45", value: "0.45" }, { label: "Lactante 0,7", value: "0.7" }] }, num("Peso", "weight", "kg", "70"), num("Sodio actual", "na", "mmol/L", "155"), num("Sodio objetivo", "target", "mmol/L", "140")],
    calculate: (v) => { const deficit = Number(v.factor) * n(v, "weight") * (n(v, "na") / n(v, "target") - 1); return { value: deficit.toFixed(2), unit: "L", interpretation: "No incluye pérdidas en curso; corregir a velocidad segura con monitorización seriada" }; },
    formula: "ACT × (Na actual/Na objetivo − 1)", source: "Estimación de agua libre; individualizar factor y velocidad de corrección",
  },
  "Ecuación de Henderson–Hasselbalch": {
    title: "pH por Henderson–Hasselbalch", subtitle: "Sistema bicarbonato/CO₂", fields: [num("Bicarbonato", "hco3", "mmol/L", "24"), num("PaCO₂", "paco2", "mmHg", "40")],
    calculate: (v) => { const ph = 6.1 + Math.log10(n(v, "hco3") / (0.03 * n(v, "paco2"))); return { value: ph.toFixed(3), interpretation: ph < 7.35 ? "Acidemia calculada" : ph > 7.45 ? "Alcalemia calculada" : "Intervalo arterial habitual" }; },
    formula: "pH = 6,1 + log[HCO₃/(0,03 × PaCO₂)]", source: "Relación ácido–base; compare con gasometría medida y consistencia interna",
  },
  "Déficit de sodio en hiponatremia": {
    title: "Déficit estimado de sodio", subtitle: "Cambio teórico hasta un sodio objetivo", fields: [{ key: "factor", label: "Factor de agua corporal total", type: "select", options: [{ label: "Varón adulto 0,6", value: "0.6" }, { label: "Mujer adulta 0,5", value: "0.5" }, { label: "Persona mayor/frágil 0,45", value: "0.45" }] }, num("Peso", "weight", "kg", "70"), num("Sodio actual", "na", "mmol/L", "122"), num("Sodio objetivo", "target", "mmol/L", "128")],
    calculate: (v) => { const deficit = Number(v.factor) * n(v, "weight") * (n(v, "target") - n(v, "na")); return { value: deficit.toFixed(0), unit: "mEq", interpretation: "No determina por sí solo la prescripción; limite la velocidad de corrección según guía" }; },
    formula: "ACT × (Na objetivo − Na actual)", source: "Estimación teórica; requiere estrategia etiológica y monitorización estrecha",
  },
  "Agua corporal total": {
    title: "Agua corporal total", subtitle: "Estimación por peso", fields: [{ key: "factor", label: "Factor", type: "select", options: [{ label: "Lactante 0,7", value: "0.7" }, { label: "Varón adulto 0,6", value: "0.6" }, { label: "Mujer adulta 0,5", value: "0.5" }, { label: "Persona mayor/frágil 0,45", value: "0.45" }] }, num("Peso", "weight", "kg", "70")],
    calculate: (v) => ({ value: (Number(v.factor) * n(v, "weight")).toFixed(1), unit: "L", interpretation: "Estimación poblacional; composición corporal puede modificarla" }),
    formula: "peso × factor", source: "Factores convencionales de agua corporal total",
  },
  "Diuresis y balance hídrico": {
    title: "Diuresis y balance hídrico", subtitle: "Cálculo por peso y tiempo", fields: [num("Peso", "weight", "kg", "70"), num("Orina", "urine", "mL", "500"), num("Duración", "hours", "h", "8"), num("Ingresos totales", "input", "mL", "1200"), num("Egresos totales", "output", "mL", "700")],
    calculate: (v) => { const rate = n(v, "urine") / n(v, "weight") / n(v, "hours"); const balance = n(v, "input") - n(v, "output"); return { value: rate.toFixed(2), unit: "mL/kg/h", interpretation: "Balance neto: " + (balance >= 0 ? "+" : "") + balance.toFixed(0) + " mL" }; },
    formula: "orina/(kg×h); balance = ingresos − egresos", source: "La diuresis debe interpretarse con perfusión, función renal y pérdidas no medidas",
  },
  "Gasto cardíaco (fórmula de Fick)": {
    title: "Gasto cardíaco por Fick", subtitle: "Principio de consumo de oxígeno", fields: [num("Consumo de O₂", "vo2", "mL/min", "250"), num("Contenido arterial de O₂", "cao2", "mL/dL", "20"), num("Contenido venoso mixto de O₂", "cvo2", "mL/dL", "15")],
    calculate: (v) => { const co = n(v, "vo2") / ((n(v, "cao2") - n(v, "cvo2")) * 10); return { value: co.toFixed(2), unit: "L/min", interpretation: "Verifique que el consumo y las muestras sean simultáneos y representativos" }; },
    formula: "VO₂ / [(CaO₂−CvO₂) × 10]", source: "Principio de Fick; unidades expresadas en mL/min y mL/dL",
  },
  "Velocidad de flujo": {
    title: "Velocidad de infusión", subtitle: "Volumen por tiempo", fields: [num("Volumen", "volume", "mL", "1000"), num("Tiempo", "hours", "h", "8")],
    calculate: (v) => ({ value: (n(v, "volume") / n(v, "hours")).toFixed(1), unit: "mL/h", interpretation: "Confirme límites del acceso, bomba y prescripción" }),
    formula: "volumen / horas", source: "Conversión de velocidad de infusión",
  },
  "Fluido intravenoso": {
    title: "Duración de una infusión", subtitle: "Tiempo estimado a velocidad constante", fields: [num("Volumen", "volume", "mL", "500"), num("Velocidad", "rate", "mL/h", "125")],
    calculate: (v) => ({ value: (n(v, "volume") / n(v, "rate")).toFixed(2), unit: "h", interpretation: "Duración teórica; considere purga, pausas y volumen residual" }),
    formula: "volumen / velocidad", source: "Conversión de tiempo de infusión",
  },
  "Recuento absoluto de eosinófilos": {
    title: "Recuento absoluto de eosinófilos", subtitle: "A partir de leucocitos y diferencial", fields: [num("Leucocitos", "wbc", "/µL", "7000"), num("Eosinófilos", "percent", "%", "4")],
    calculate: (v) => ({ value: Math.round(n(v, "wbc") * n(v, "percent") / 100).toString(), unit: "/µL", interpretation: "Interpretar según edad, laboratorio, clínica y medicación" }),
    formula: "leucocitos × % eosinófilos / 100", source: "Cálculo de recuento absoluto a partir del diferencial",
  },
  "Recuento absoluto de linfocitos": {
    title: "Recuento absoluto de linfocitos", subtitle: "A partir de leucocitos y diferencial", fields: [num("Leucocitos", "wbc", "/µL", "7000"), num("Linfocitos", "percent", "%", "30")],
    calculate: (v) => ({ value: Math.round(n(v, "wbc") * n(v, "percent") / 100).toString(), unit: "/µL", interpretation: "Los intervalos varían considerablemente con la edad" }),
    formula: "leucocitos × % linfocitos / 100", source: "Cálculo de recuento absoluto a partir del diferencial",
  },
  "Recuento de reticulocitos corregido": {
    title: "Reticulocitos corregidos", subtitle: "Corrección por hematocrito", fields: [num("Reticulocitos", "retic", "%", "5"), num("Hematocrito del paciente", "hct", "%", "25"), num("Hematocrito de referencia", "normal", "%", "45")],
    calculate: (v) => ({ value: (n(v, "retic") * n(v, "hct") / n(v, "normal")).toFixed(2), unit: "%", interpretation: "Para respuesta medular completa puede requerirse índice de producción reticulocitaria" }),
    formula: "% reticulocitos × Hto paciente / Hto normal", source: "Corrección hematológica convencional",
  },
  "Glucosa media estimada desde HbA1c": {
    title: "Glucosa media estimada", subtitle: "Conversión desde HbA1c", fields: [num("HbA1c", "a1c", "%", "7")],
    calculate: (v) => ({ value: (28.7 * n(v, "a1c") - 46.7).toFixed(0), unit: "mg/dL", interpretation: "Promedio estimado; puede diferir con alteraciones eritrocitarias o variabilidad glucémica" }),
    formula: "eAG = 28,7 × HbA1c − 46,7", source: "Relación ADAG; interpretar con método y contexto clínico",
  },
  "Estimación de HbA1c desde glucosa media": {
    title: "HbA1c estimada", subtitle: "Conversión desde glucosa media", fields: [num("Glucosa media", "glucose", "mg/dL", "154")],
    calculate: (v) => ({ value: ((n(v, "glucose") + 46.7) / 28.7).toFixed(1), unit: "%", interpretation: "Estimación matemática; no reemplaza una HbA1c medida" }),
    formula: "HbA1c = (eAG + 46,7) / 28,7", source: "Relación ADAG invertida",
  },
  "Índice apnea–hipopnea": {
    title: "Índice apnea–hipopnea", subtitle: "Eventos respiratorios por hora de sueño", fields: [num("Apneas", "apneas", "eventos", "8"), num("Hipopneas", "hypopneas", "eventos", "16"), num("Tiempo total de sueño", "hours", "h", "6")],
    calculate: (v) => ({ value: ((n(v, "apneas") + n(v, "hypopneas")) / n(v, "hours")).toFixed(1), unit: "eventos/h", interpretation: "La clasificación depende de edad y criterios de puntuación del estudio" }),
    formula: "(apneas + hipopneas) / horas de sueño", source: "Definición polisomnográfica; use reglas de puntuación vigentes del laboratorio",
  },
  "Índice de saturación de oxígeno": {
    title: "Índice de oxigenación", subtitle: "Soporte respiratorio y oxigenación", fields: [num("FiO₂", "fio2", "fracción", "0.6"), num("Presión media de vía aérea", "map", "cmH₂O", "14"), num("PaO₂", "pao2", "mmHg", "80")],
    calculate: (v) => ({ value: (n(v, "fio2") * n(v, "map") * 100 / n(v, "pao2")).toFixed(1), interpretation: "Tendencia útil en ventilación; confirme que la entrada sea PaO₂, no SpO₂" }),
    formula: "FiO₂ × presión media × 100 / PaO₂", source: "Índice de oxigenación; se distingue del índice de saturación basado en SpO₂",
  },
  "Índice de alteración respiratoria (RDI)": {
    title: "Índice de alteración respiratoria", subtitle: "Eventos respiratorios totales por hora", fields: [num("Apneas", "apneas", "eventos", "8"), num("Hipopneas", "hypopneas", "eventos", "16"), num("RERA", "rera", "eventos", "6"), num("Tiempo total de sueño", "hours", "h", "6")],
    calculate: (v) => ({ value: ((n(v, "apneas") + n(v, "hypopneas") + n(v, "rera")) / n(v, "hours")).toFixed(1), unit: "eventos/h", interpretation: "Verifique definición utilizada por el laboratorio y población" }),
    formula: "(apneas + hipopneas + RERA) / horas de sueño", source: "Definición polisomnográfica convencional",
  },
  "Corrección de leucocitos en LCR por hematíes": {
    title: "Leucocitos corregidos en LCR", subtitle: "Punción lumbar traumática", fields: [num("Leucocitos observados", "wbc", "/µL", "30"), num("Hematíes en LCR", "rbc", "/µL", "5000"), num("Relación de corrección", "ratio", "hematíes/leucocito", "500")],
    calculate: (v) => { const corrected = Math.max(0, n(v, "wbc") - n(v, "rbc") / n(v, "ratio")); return { value: corrected.toFixed(1), unit: "/µL", interpretation: "La corrección no descarta meningitis; priorice clínica, cultivo y pruebas microbiológicas" }; },
    formula: "WBC observados − RBC/relación", source: "Corrección aproximada; 500–1000 RBC por WBC según protocolo",
  },
  "Corrección de proteínas en LCR contaminado con sangre": {
    title: "Proteína corregida en LCR", subtitle: "Estimación tras punción traumática", fields: [num("Proteína observada", "protein", "mg/dL", "90"), num("Hematíes en LCR", "rbc", "/µL", "10000"), num("Corrección por 1000 hematíes", "factor", "mg/dL", "1.1")],
    calculate: (v) => ({ value: Math.max(0, n(v, "protein") - n(v, "rbc") / 1000 * n(v, "factor")).toFixed(1), unit: "mg/dL", interpretation: "Estimación con incertidumbre; interpretar según edad y sospecha infecciosa" }),
    formula: "proteína observada − (RBC/1000 × factor)", source: "Corrección aproximada dependiente de población y protocolo",
  },
  "Gradiente albúmina suero–ascitis (GASA)": {
    title: "Gradiente albúmina suero–ascitis", subtitle: "GASA / SAAG", fields: [num("Albúmina sérica", "serum", "g/dL", "3.2"), num("Albúmina ascítica", "ascites", "g/dL", "1.4")],
    calculate: (v) => { const saag = n(v, "serum") - n(v, "ascites"); return { value: saag.toFixed(2), unit: "g/dL", interpretation: saag >= 1.1 ? "≥1,1: compatible con hipertensión portal en el contexto apropiado" : "<1,1: investigar causas sin hipertensión portal" }; },
    formula: "albúmina sérica − albúmina ascítica", source: "Muestras idealmente obtenidas el mismo día; correlacionar con proteínas y clínica",
  },
  "Brecha osmolar fecal": {
    title: "Brecha osmolar fecal", subtitle: "Clasificación orientativa de diarrea acuosa", fields: [num("Sodio fecal", "na", "mmol/L", "40"), num("Potasio fecal", "k", "mmol/L", "30")],
    calculate: (v) => { const gap = 290 - 2 * (n(v, "na") + n(v, "k")); return { value: gap.toFixed(0), unit: "mOsm/kg", interpretation: gap > 100 ? "Elevada: patrón osmótico posible" : gap < 50 ? "Baja: patrón secretor posible" : "Zona intermedia" }; },
    formula: "290 − 2 × (Na fecal + K fecal)", source: "No use osmolalidad fecal medida almacenada; interpretar con contexto",
  },
  "Cálculo de volumen sanguíneo": {
    title: "Volumen sanguíneo calculado", subtitle: "Estimación por peso y población", fields: [{ key: "group", label: "Grupo", type: "select", options: [{ label: "Prematuro 95 mL/kg", value: "95" }, { label: "Recién nacido 85 mL/kg", value: "85" }, { label: "Niño 75 mL/kg", value: "75" }, { label: "Adulto 70 mL/kg", value: "70" }, { label: "Adulta 65 mL/kg", value: "65" }] }, num("Peso", "weight", "kg", "70")],
    calculate: (v) => ({ value: Math.round(Number(v.group) * n(v, "weight")).toString(), unit: "mL", interpretation: "Estimación; use protocolo transfusional específico para decisiones" }),
    formula: "peso × factor de volumen sanguíneo", source: "Factores poblacionales aproximados por edad y sexo",
  },
  "Volumen de infusión de linfocitos del donante (DLI)": {
    title: "Volumen de DLI", subtitle: "Según dosis CD3⁺ objetivo", fields: [num("Dosis CD3⁺ objetivo", "dose", "10⁶ células/kg", "1"), num("Peso", "weight", "kg", "70"), num("Concentración del producto", "concentration", "10⁶ células/mL", "20")],
    calculate: (v) => ({ value: (n(v, "dose") * n(v, "weight") / n(v, "concentration")).toFixed(2), unit: "mL", interpretation: "Verifique viabilidad, concentración informada, compatibilidad y protocolo del centro" }),
    formula: "dosis objetivo × peso / concentración", source: "Cálculo de volumen celular; requiere validación por terapia celular/hemoterapia",
  },
  "Bicarbonato y exceso de base": {
    title: "Exceso de base estimado",
    subtitle: "Ecuación de Van Slyke simplificada a partir de pH y bicarbonato",
    fields: [num("pH arterial", "ph", "", "7.40", { min: 6.5, max: 8 }), num("Bicarbonato", "hco3", "mmol/L", "24", { min: 0 })],
    calculate: (v) => { const baseExcess = 0.93 * (n(v, "hco3") - 24.4 + 14.8 * (n(v, "ph") - 7.4)); return { value: baseExcess.toFixed(1), unit: "mmol/L", interpretation: baseExcess < -2 ? "Déficit de base: componente metabólico acidótico posible." : baseExcess > 2 ? "Exceso de base: componente metabólico alcalótico posible." : "Intervalo habitual aproximado (−2 a +2 mmol/L)." }; },
    formula: "BE = 0,93 × [HCO₃ − 24,4 + 14,8 × (pH − 7,40)]",
    source: "Ecuación de Van Slyke simplificada; interpretar junto con gasometría completa",
  },
  "Aclaramiento de creatinina": {
    title: "Aclaramiento de creatinina estimado",
    subtitle: "Cockcroft–Gault para adultos",
    fields: [sexField, num("Edad", "age", "años", "60", { min: 18 }), num("Peso", "weight", "kg", "70", { min: 1 }), num("Creatinina sérica", "scr", "mg/dL", "1", { min: 0.01 })],
    calculate: (v) => { let result = (140 - n(v, "age")) * n(v, "weight") / (72 * n(v, "scr")); if (v.sex === "f") result *= 0.85; return { value: result.toFixed(1), unit: "mL/min", interpretation: "Estimación no normalizada por superficie corporal; seleccione el descriptor de peso conforme al fármaco y protocolo." }; },
    formula: "[(140 − edad) × peso] ÷ (72 × creatinina); ×0,85 en mujer",
    source: "Cockcroft–Gault; no intercambiar directamente con eGFR",
  },
  "Aclaramiento de creatinina (Schwartz)": {
    title: "TFG pediátrica estimada",
    subtitle: "Ecuación bedside Schwartz actualizada",
    fields: [num("Talla", "height", "cm", "120", { min: 20 }), num("Creatinina sérica", "scr", "mg/dL", "0.6", { min: 0.01 })],
    calculate: (v) => ({ value: (0.413 * n(v, "height") / n(v, "scr")).toFixed(1), unit: "mL/min/1,73 m²", interpretation: "Estimación pediátrica; la precisión disminuye con masa muscular atípica o creatinina inestable." }),
    formula: "0,413 × talla (cm) ÷ creatinina (mg/dL)",
    source: "Ecuación bedside CKiD Schwartz",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/19158356/",
  },
  "Excreción fraccional de magnesio": {
    title: "Excreción fraccional de magnesio",
    subtitle: "FEMg con corrección de la fracción sérica ultrafiltrable",
    fields: [num("Magnesio urinario", "umg", "mg/dL", "5"), num("Creatinina sérica", "scr", "mg/dL", "1"), num("Magnesio sérico", "smg", "mg/dL", "2"), num("Creatinina urinaria", "ucr", "mg/dL", "100")],
    calculate: (v) => { const result = n(v, "umg") * n(v, "scr") * 100 / (0.7 * n(v, "smg") * n(v, "ucr")); return { value: result.toFixed(2), unit: "%", interpretation: "Interpretar con función renal, carga de magnesio y protocolo local; el factor 0,7 aproxima la fracción ultrafiltrable." }; },
    formula: "(MgU × CrS) ÷ (0,7 × MgS × CrU) × 100",
    source: "Cálculo renal convencional; los umbrales dependen del contexto clínico",
  },
  "Equivalentes de calcio": {
    title: "Equivalentes de calcio elemental",
    subtitle: "Conversión entre masa, milimoles y miliequivalentes",
    fields: [{ key: "unit", label: "Unidad de origen", type: "select", options: [{ label: "mg de calcio elemental", value: "mg" }, { label: "mmol de calcio", value: "mmol" }, { label: "mEq de calcio", value: "meq" }] }, num("Cantidad", "amount", "", "100", { min: 0 })],
    calculate: (v) => { const mmol = v.unit === "mg" ? n(v, "amount") / 40.078 : v.unit === "meq" ? n(v, "amount") / 2 : n(v, "amount"); return { value: (mmol * 40.078).toFixed(2), unit: "mg de Ca elemental", interpretation: `${mmol.toFixed(3)} mmol · ${(mmol * 2).toFixed(3)} mEq. La cantidad de sal (gluconato, cloruro, carbonato) no equivale a calcio elemental.` }; },
    formula: "1 mmol Ca = 40,078 mg = 2 mEq",
    source: "Masa atómica estándar de calcio y valencia +2; verificar concentración del producto",
    sourceUrl: "https://ciaaw.org/calcium.htm",
  },
  "Conversión a unidades SI": {
    title: "Conversión de laboratorio a unidades SI",
    subtitle: "Conversores frecuentes de mg/dL a mmol/L o µmol/L",
    fields: [{ key: "analyte", label: "Analito", type: "select", options: [{ label: "Glucosa: mg/dL → mmol/L", value: "glucose" }, { label: "Colesterol: mg/dL → mmol/L", value: "cholesterol" }, { label: "Triglicéridos: mg/dL → mmol/L", value: "triglycerides" }, { label: "Creatinina: mg/dL → µmol/L", value: "creatinine" }, { label: "Bilirrubina: mg/dL → µmol/L", value: "bilirubin" }, { label: "Calcio: mg/dL → mmol/L", value: "calcium" }] }, num("Resultado convencional", "amount", "mg/dL", "100", { min: 0 })],
    calculate: (v) => { const map = { glucose: { factor: 0.0555, unit: "mmol/L", label: "Glucosa" }, cholesterol: { factor: 0.02586, unit: "mmol/L", label: "Colesterol" }, triglycerides: { factor: 0.01129, unit: "mmol/L", label: "Triglicéridos" }, creatinine: { factor: 88.4, unit: "µmol/L", label: "Creatinina" }, bilirubin: { factor: 17.104, unit: "µmol/L", label: "Bilirrubina" }, calcium: { factor: 0.2495, unit: "mmol/L", label: "Calcio" } } as const; const item = map[v.analyte as keyof typeof map]; if (!item) return { value: "—", interpretation: "Selecciona un analito." }; return { value: (n(v, "amount") * item.factor).toFixed(item.unit === "mmol/L" ? 3 : 1), unit: item.unit, interpretation: `${item.label}: conversión matemática. Respeta el tipo de muestra y el intervalo del laboratorio.` }; },
    formula: "resultado SI = resultado convencional × factor específico del analito",
    source: "Factores basados en masa molar; confirme unidades impresas por el laboratorio",
  },
  "Gasto energético en reposo": {
    title: "Gasto energético en reposo",
    subtitle: "Ecuación de Mifflin–St Jeor en adultos",
    fields: [sexField, num("Edad", "age", "años", "40", { min: 18 }), num("Peso", "weight", "kg", "70", { min: 1 }), num("Talla", "height", "cm", "170", { min: 50 })],
    calculate: (v) => { const result = 10 * n(v, "weight") + 6.25 * n(v, "height") - 5 * n(v, "age") + (v.sex === "m" ? 5 : -161); return { value: Math.round(result).toString(), unit: "kcal/día", interpretation: "Estimación en reposo; no incluye factor de actividad ni estrés. Prefiera calorimetría indirecta cuando esté indicada." }; },
    formula: "10P + 6,25T − 5E + 5 (hombre) o −161 (mujer)",
    source: "Mifflin–St Jeor",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/2305711/",
  },
  "Recuento absoluto de reticulocitos": {
    title: "Recuento absoluto de reticulocitos",
    subtitle: "Conversión desde recuento eritrocitario y porcentaje",
    fields: [num("Eritrocitos", "rbc", "millones/µL", "4.5", { min: 0 }), num("Reticulocitos", "retic", "%", "2", { min: 0, max: 100 })],
    calculate: (v) => ({ value: Math.round(n(v, "rbc") * 1000000 * n(v, "retic") / 100).toString(), unit: "/µL", interpretation: "Compare con intervalos específicos de edad y laboratorio; para anemia puede requerirse corrección por hematocrito." }),
    formula: "eritrocitos/µL × reticulocitos (%) ÷ 100",
    source: "Cálculo hematológico del recuento absoluto",
  },
  "Índices hematimétricos": {
    title: "Índices hematimétricos calculados",
    subtitle: "VCM, HCM y CHCM a partir de hemograma",
    fields: [num("Hemoglobina", "hb", "g/dL", "14", { min: 0 }), num("Hematocrito", "hct", "%", "42", { min: 0 }), num("Eritrocitos", "rbc", "millones/µL", "4.8", { min: 0.01 })],
    calculate: (v) => { const mcv = n(v, "hct") * 10 / n(v, "rbc"); const mch = n(v, "hb") * 10 / n(v, "rbc"); const mchc = n(v, "hb") * 100 / n(v, "hct"); return { value: mcv.toFixed(1), unit: "fL (VCM)", interpretation: `HCM ${mch.toFixed(1)} pg · CHCM ${mchc.toFixed(1)} g/dL. Interpretar con intervalos de edad, método y laboratorio.` }; },
    formula: "VCM = Hto×10/RBC; HCM = Hb×10/RBC; CHCM = Hb×100/Hto",
    source: "Índices eritrocitarios derivados del hemograma",
  },
  "Índice BASDAI": {
    title: "Índice BASDAI",
    subtitle: "Actividad de espondilitis anquilosante, escalas 0–10",
    fields: [num("Fatiga", "q1", "0–10", "5", { min: 0, max: 10 }), num("Dolor axial", "q2", "0–10", "5", { min: 0, max: 10 }), num("Dolor/inflamación periférica", "q3", "0–10", "3", { min: 0, max: 10 }), num("Entesitis", "q4", "0–10", "3", { min: 0, max: 10 }), num("Intensidad de rigidez matinal", "q5", "0–10", "5", { min: 0, max: 10 }), num("Duración de rigidez matinal", "q6", "0–10", "5", { min: 0, max: 10 })],
    calculate: (v) => { const result = (n(v, "q1") + n(v, "q2") + n(v, "q3") + n(v, "q4") + (n(v, "q5") + n(v, "q6")) / 2) / 5; return { value: result.toFixed(1), unit: "/10", interpretation: result >= 4 ? "Actividad elevada por umbral clásico; valorar contexto, tratamiento y medidas complementarias." : "Por debajo del umbral clásico de 4; interpretar tendencia y contexto." }; },
    formula: "[Q1 + Q2 + Q3 + Q4 + (Q5+Q6)/2] ÷ 5",
    source: "BASDAI original",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/7788318/",
  },
  "Score global BAS-G": {
    title: "BAS-G",
    subtitle: "Evaluación global del bienestar en espondilitis anquilosante",
    fields: [num("Bienestar durante la última semana", "week", "0–10", "4", { min: 0, max: 10 }), num("Bienestar durante los últimos 6 meses", "months", "0–10", "5", { min: 0, max: 10 })],
    calculate: (v) => ({ value: ((n(v, "week") + n(v, "months")) / 2).toFixed(1), unit: "/10", interpretation: "Mayor puntuación indica peor bienestar percibido; utilice la tendencia longitudinal." }),
    formula: "promedio de las dos escalas visuales 0–10",
    source: "Bath Ankylosing Spondylitis Global score",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/7788319/",
  },
  "Calculadora diagnóstica de fibromialgia": {
    title: "Criterios de fibromialgia 2016",
    subtitle: "WPI, severidad de síntomas, distribución y duración",
    fields: [num("Widespread Pain Index (WPI)", "wpi", "0–19", "8", { min: 0, max: 19 }), num("Symptom Severity Scale (SSS)", "sss", "0–12", "6", { min: 0, max: 12 }), num("Regiones dolorosas", "regions", "0–5", "4", { min: 0, max: 5 }), yesNo("Síntomas durante ≥3 meses", "duration")],
    calculate: (v) => { const wpi = n(v, "wpi"); const sss = n(v, "sss"); const symptomThreshold = (wpi >= 7 && sss >= 5) || (wpi >= 4 && wpi <= 6 && sss >= 9); const meets = symptomThreshold && n(v, "regions") >= 4 && v.duration === "yes"; return { value: meets ? "Cumple" : "No cumple", unit: "criterios 2016", interpretation: `Severidad FS (WPI + SSS): ${wpi + sss}/31. ${meets ? "Se satisfacen los tres requisitos principales." : "No se satisfacen todos los requisitos."} Es una evaluación clínica en adultos, no un autodiagnóstico; otras enfermedades relevantes pueden coexistir.` }; },
    formula: "(WPI≥7 y SSS≥5, o WPI 4–6 y SSS≥9) + dolor en ≥4/5 regiones + duración ≥3 meses",
    source: "Wolfe et al. — revisión 2016 de criterios de fibromialgia",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/27916278/",
  },
  "Índice predictivo de asma (API)": {
    title: "Asthma Predictive Index original",
    subtitle: "Riesgo de asma persistente en niños pequeños con sibilancias recurrentes",
    fields: [num("Episodios de sibilancias por año", "episodes", "", "4", { min: 0 }), yesNo("Asma diagnosticada en un progenitor", "parent"), yesNo("Dermatitis atópica diagnosticada", "eczema"), yesNo("Rinitis alérgica diagnosticada", "rhinitis"), yesNo("Sibilancias sin resfriado", "apart"), yesNo("Eosinófilos periféricos ≥4%", "eosinophils")],
    calculate: (v) => { const major = [v.parent, v.eczema].filter((x) => x === "yes").length; const minor = [v.rhinitis, v.apart, v.eosinophils].filter((x) => x === "yes").length; const positive = n(v, "episodes") >= 3 && (major >= 1 || minor >= 2); return { value: positive ? "API positivo" : "API negativo", interpretation: `${major} criterio(s) mayor(es), ${minor} menor(es). El API positivo incrementa el riesgo, pero un resultado negativo no descarta asma futura.` }; },
    formula: "sibilancias recurrentes + ≥1 criterio mayor o ≥2 menores",
    source: "Castro-Rodríguez et al. / Tucson Children's Respiratory Study",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/31463300/",
  },
  "Índice predictivo de asma modificado (mAPI)": {
    title: "Modified Asthma Predictive Index",
    subtitle: "Riesgo en preescolares con episodios recurrentes de sibilancias",
    fields: [num("Episodios de sibilancias en 12 meses", "episodes", "", "4", { min: 0 }), yesNo("Al menos un episodio confirmado clínicamente", "confirmed"), yesNo("Asma diagnosticada en un progenitor", "parent"), yesNo("Dermatitis atópica diagnosticada", "eczema"), yesNo("Sensibilización a ≥1 aeroalérgeno", "aero"), yesNo("Sibilancias sin resfriado", "apart"), yesNo("Eosinófilos periféricos ≥4%", "eosinophils"), yesNo("Sensibilización a leche, huevo o cacahuate", "food")],
    calculate: (v) => { const major = [v.parent, v.eczema, v.aero].filter((x) => x === "yes").length; const minor = [v.apart, v.eosinophils, v.food].filter((x) => x === "yes").length; const positive = n(v, "episodes") >= 4 && v.confirmed === "yes" && (major >= 1 || minor >= 2); return { value: positive ? "mAPI positivo" : "mAPI negativo", interpretation: `${major} criterio(s) mayor(es), ${minor} menor(es). Aplicar solo a la población preescolar para la que fue diseñado; no establece diagnóstico de asma por sí solo.` }; },
    formula: "≥4 episodios/año (≥1 confirmado) + ≥1 mayor o ≥2 menores",
    source: "Modified Asthma Predictive Index; criterios resumidos en revisión pediátrica",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/31463300/",
  },
};

const scores: Record<string, ScoreDefinition> = {
  "Score APGAR": {
    title: "Score APGAR", subtitle: "Evaluación del recién nacido a 1 y 5 minutos",
    rows: [
      { key: "appearance", label: "Apariencia / color", options: [{ label: "Pálido o cianótico", value: 0 }, { label: "Tronco rosado, extremidades azules", value: 1 }, { label: "Completamente rosado", value: 2 }] },
      { key: "pulse", label: "Pulso", options: [{ label: "Ausente", value: 0 }, { label: "< 100 lpm", value: 1 }, { label: "≥ 100 lpm", value: 2 }] },
      { key: "grimace", label: "Respuesta refleja", options: [{ label: "Sin respuesta", value: 0 }, { label: "Mueca", value: 1 }, { label: "Llanto, tos o estornudo", value: 2 }] },
      { key: "activity", label: "Tono muscular", options: [{ label: "Flácido", value: 0 }, { label: "Flexión leve", value: 1 }, { label: "Movimiento activo", value: 2 }] },
      { key: "respiration", label: "Respiración", options: [{ label: "Ausente", value: 0 }, { label: "Lenta o irregular", value: 1 }, { label: "Buena, llanto vigoroso", value: 2 }] },
    ],
    interpret: (s) => s >= 7 ? "Resultado tranquilizador a los 5 minutos; documentar tiempo exacto." : s >= 4 ? "Moderadamente anormal; continuar evaluación y soporte clínico." : "Bajo; requiere atención inmediata. No usar APGAR para decidir el inicio de reanimación.",
    source: "ACOG/AAP — The Apgar Score", sourceUrl: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/10/the-apgar-score",
  },
  "Escala de coma de Glasgow": {
    title: "Escala de coma de Glasgow", subtitle: "Respuesta ocular, verbal y motora",
    rows: [
      { key: "eyes", label: "Apertura ocular", options: [{ label: "Ninguna", value: 1 }, { label: "Al dolor", value: 2 }, { label: "A la voz", value: 3 }, { label: "Espontánea", value: 4 }] },
      { key: "verbal", label: "Respuesta verbal", options: [{ label: "Ninguna", value: 1 }, { label: "Sonidos incomprensibles", value: 2 }, { label: "Palabras inapropiadas", value: 3 }, { label: "Confusa", value: 4 }, { label: "Orientada", value: 5 }] },
      { key: "motor", label: "Respuesta motora", options: [{ label: "Ninguna", value: 1 }, { label: "Extensión", value: 2 }, { label: "Flexión anormal", value: 3 }, { label: "Retira", value: 4 }, { label: "Localiza", value: 5 }, { label: "Obedece órdenes", value: 6 }] },
    ],
    interpret: (s) => s <= 8 ? "Compromiso grave; valorar vía aérea y causas reversibles." : s <= 12 ? "Compromiso moderado." : "Compromiso leve o normal; documente componentes además del total.",
    source: "Glasgow Coma Scale; registrar E, V y M por separado",
  },
  "Escala de dolor FLACC": {
    title: "Escala FLACC", subtitle: "Dolor en pacientes no verbales",
    rows: [
      { key: "face", label: "Cara", options: [{ label: "Relajada", value: 0 }, { label: "Mueca ocasional", value: 1 }, { label: "Mueca frecuente", value: 2 }] },
      { key: "legs", label: "Piernas", options: [{ label: "Relajadas", value: 0 }, { label: "Inquietas", value: 1 }, { label: "Pataleo o flexión", value: 2 }] },
      { key: "activity", label: "Actividad", options: [{ label: "Tranquilo", value: 0 }, { label: "Se retuerce", value: 1 }, { label: "Arqueado o rígido", value: 2 }] },
      { key: "cry", label: "Llanto", options: [{ label: "Sin llanto", value: 0 }, { label: "Gemidos", value: 1 }, { label: "Llanto persistente", value: 2 }] },
      { key: "console", label: "Consolabilidad", options: [{ label: "Contento", value: 0 }, { label: "Se consuela", value: 1 }, { label: "Difícil de consolar", value: 2 }] },
    ],
    interpret: (s) => s === 0 ? "Relajado/confortable" : s <= 3 ? "Molestia leve" : s <= 6 ? "Dolor moderado" : "Dolor intenso",
    source: "FLACC; correlacionar con contexto y reevaluación",
  },
  "Score Centor/McIsaac para faringitis estreptocócica": {
    title: "Score Centor/McIsaac", subtitle: "Probabilidad pretest de faringitis estreptocócica",
    rows: [
      { key: "fever", label: "Fiebre > 38 °C", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "exudate", label: "Exudado/amigdalitis", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "nodes", label: "Adenopatías cervicales anteriores dolorosas", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "cough", label: "Ausencia de tos", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "age", label: "Edad", options: [{ label: "3–14 años", value: 1 }, { label: "15–44 años", value: 0 }, { label: "≥ 45 años", value: -1 }] },
    ],
    interpret: (s) => s <= 0 ? "Riesgo bajo; manejo según guía local." : s <= 2 ? "Riesgo bajo-intermedio; considerar prueba según disponibilidad." : "Riesgo mayor; confirmar con prueba cuando corresponda antes de antibióticos.",
    source: "McIsaac modificado; seguir guía antimicrobiana local",
  },
  "Score de Bishop para inducción del parto": {
    title: "Score de Bishop", subtitle: "Madurez cervical previa a inducción",
    rows: [
      { key: "dilation", label: "Dilatación", options: [{ label: "Cerrado", value: 0 }, { label: "1–2 cm", value: 1 }, { label: "3–4 cm", value: 2 }, { label: "≥ 5 cm", value: 3 }] },
      { key: "effacement", label: "Borramiento", options: [{ label: "0–30%", value: 0 }, { label: "40–50%", value: 1 }, { label: "60–70%", value: 2 }, { label: "≥ 80%", value: 3 }] },
      { key: "station", label: "Estación", options: [{ label: "−3", value: 0 }, { label: "−2", value: 1 }, { label: "−1 / 0", value: 2 }, { label: "+1 / +2", value: 3 }] },
      { key: "consistency", label: "Consistencia", options: [{ label: "Firme", value: 0 }, { label: "Media", value: 1 }, { label: "Blanda", value: 2 }] },
      { key: "position", label: "Posición", options: [{ label: "Posterior", value: 0 }, { label: "Media", value: 1 }, { label: "Anterior", value: 2 }] },
    ],
    interpret: (s) => s >= 8 ? "Cérvix favorable para inducción." : s >= 6 ? "Favorabilidad intermedia; individualizar estrategia." : "Cérvix desfavorable; considerar maduración según protocolo.",
    source: "Bishop score; decisiones según contexto obstétrico",
  },
  "Score Child–Pugh": {
    title: "Score Child–Pugh", subtitle: "Severidad de cirrosis", rows: [
      { key: "bilirubin", label: "Bilirrubina total", options: [{ label: "< 2 mg/dL", value: 1 }, { label: "2–3 mg/dL", value: 2 }, { label: "> 3 mg/dL", value: 3 }] },
      { key: "albumin", label: "Albúmina", options: [{ label: "> 3,5 g/dL", value: 1 }, { label: "2,8–3,5 g/dL", value: 2 }, { label: "< 2,8 g/dL", value: 3 }] },
      { key: "inr", label: "INR", options: [{ label: "< 1,7", value: 1 }, { label: "1,7–2,3", value: 2 }, { label: "> 2,3", value: 3 }] },
      { key: "ascites", label: "Ascitis", options: [{ label: "Ausente", value: 1 }, { label: "Leve/controlada", value: 2 }, { label: "Moderada-grave/refractaria", value: 3 }] },
      { key: "encephalopathy", label: "Encefalopatía", options: [{ label: "Ausente", value: 1 }, { label: "Grado I–II", value: 2 }, { label: "Grado III–IV", value: 3 }] },
    ], interpret: (s) => s <= 6 ? "Clase A (5–6 puntos)." : s <= 9 ? "Clase B (7–9 puntos)." : "Clase C (10–15 puntos).",
    source: "Child–Pugh; los componentes clínicos requieren juicio y contexto",
  },
  "Score de Alvarado para apendicitis": {
    title: "Score de Alvarado", subtitle: "Probabilidad clínica de apendicitis", rows: [
      { key: "migration", label: "Migración del dolor a FID", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "anorexia", label: "Anorexia", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "nausea", label: "Náuseas o vómitos", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "tenderness", label: "Dolor en FID", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
      { key: "rebound", label: "Rebote/peritonismo", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "fever", label: "Temperatura ≥37,3 °C", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "leukocytosis", label: "Leucocitosis >10.000/µL", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
      { key: "shift", label: "Neutrofilia/desviación izquierda", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
    ], interpret: (s) => s <= 4 ? "Baja probabilidad por corte habitual; reevaluar según clínica." : s <= 6 ? "Probabilidad intermedia; considerar imagen/observación según protocolo." : "Probabilidad alta; valoración quirúrgica y estrategia diagnóstica local.",
    source: "Alvarado/MANTRELS; rendimiento variable por población",
  },
  "Score Westley para crup": {
    title: "Score de Westley", subtitle: "Severidad clínica del crup", rows: [
      { key: "consciousness", label: "Nivel de conciencia", options: [{ label: "Normal", value: 0 }, { label: "Alterado", value: 5 }] },
      { key: "cyanosis", label: "Cianosis", options: [{ label: "Ninguna", value: 0 }, { label: "Con agitación", value: 4 }, { label: "En reposo", value: 5 }] },
      { key: "stridor", label: "Estridor", options: [{ label: "Ninguno", value: 0 }, { label: "Con agitación", value: 1 }, { label: "En reposo", value: 2 }] },
      { key: "air", label: "Entrada de aire", options: [{ label: "Normal", value: 0 }, { label: "Disminuida", value: 1 }, { label: "Muy disminuida", value: 2 }] },
      { key: "retractions", label: "Retracciones", options: [{ label: "Ninguna", value: 0 }, { label: "Leves", value: 1 }, { label: "Moderadas", value: 2 }, { label: "Graves", value: 3 }] },
    ], interpret: (s) => s <= 2 ? "Crup leve." : s <= 5 ? "Crup moderado." : s <= 11 ? "Crup grave." : "Riesgo de falla respiratoria inminente; atención urgente.",
    source: "Westley croup score; el tratamiento depende de evaluación clínica y protocolo",
  },
  "Score FeverPAIN": {
    title: "Score FeverPAIN",
    subtitle: "Estratificación clínica de faringitis aguda",
    rows: [
      { key: "fever", label: "Fiebre en las últimas 24 horas", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "purulence", label: "Exudado/pus amigdalino", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "attend", label: "Consulta dentro de los 3 primeros días", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "inflamed", label: "Amígdalas intensamente inflamadas", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "coryza", label: "Ausencia de tos o coriza", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
    ],
    interpret: (s) => s <= 1 ? "Baja probabilidad de estreptococo; manejo sintomático según guía." : s <= 3 ? "Probabilidad intermedia; considerar prueba o estrategia diferida según guía local." : "Probabilidad mayor; confirmar y tratar según guía antimicrobiana local.",
    source: "Ensayo PRISM y derivación de FeverPAIN — Health Technology Assessment",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK261551/",
  },
  "Criterios de Kocher para artritis séptica": {
    title: "Criterios de Kocher",
    subtitle: "Diferenciación entre artritis séptica y sinovitis transitoria de cadera en niños",
    rows: [
      { key: "weight", label: "Incapacidad para apoyar peso", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "fever", label: "Temperatura >38,5 °C", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "esr", label: "VSG ≥40 mm/h", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "wbc", label: "Leucocitos >12.000/µL", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
    ],
    interpret: (s) => s === 0 ? "Pocos predictores, pero no excluye infección." : s <= 2 ? "Riesgo intermedio; integrar exploración, ecografía, marcadores y evolución." : "Múltiples predictores; valoración ortopédica urgente y estrategia diagnóstica local. No extrapolar a rodilla.",
    source: "Kocher et al., algoritmo original para cadera pediátrica",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/10608376/",
  },
  "Score AIR para apendicitis": {
    title: "Appendicitis Inflammatory Response score",
    subtitle: "Riesgo de apendicitis en mayores de 5 años con sospecha clínica",
    rows: [
      { key: "vomit", label: "Vómitos", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "rlq", label: "Dolor en fosa ilíaca derecha", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "defense", label: "Defensa muscular", options: [{ label: "Ninguna", value: 0 }, { label: "Leve", value: 1 }, { label: "Media", value: 2 }, { label: "Fuerte", value: 3 }] },
      { key: "temp", label: "Temperatura ≥38,5 °C", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "neut", label: "Neutrófilos", options: [{ label: "<70%", value: 0 }, { label: "70–84%", value: 1 }, { label: "≥85%", value: 2 }] },
      { key: "wbc", label: "Leucocitos", options: [{ label: "<10 ×10⁹/L", value: 0 }, { label: "10–14,9 ×10⁹/L", value: 1 }, { label: "≥15 ×10⁹/L", value: 2 }] },
      { key: "crp", label: "Proteína C reactiva", options: [{ label: "<10 mg/L", value: 0 }, { label: "10–49 mg/L", value: 1 }, { label: "≥50 mg/L", value: 2 }] },
    ],
    interpret: (s) => s <= 4 ? "Riesgo bajo en el modelo original; observación/reevaluación según clínica." : s <= 8 ? "Riesgo intermedio; evaluación adicional e imagen selectiva según protocolo." : "Riesgo alto; valoración quirúrgica urgente según protocolo.",
    source: "Andersson & Andersson — estudio de construcción del AIR score",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18553045/",
  },
  "Score pediátrico de apendicitis": {
    title: "Pediatric Appendicitis Score",
    subtitle: "Estratificación clínica de sospecha de apendicitis en niños",
    rows: [
      { key: "migration", label: "Migración del dolor a FID", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "anorexia", label: "Anorexia", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "nausea", label: "Náuseas/vómitos", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "fever", label: "Fiebre ≥38 °C", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "cough", label: "Dolor con tos, percusión o salto", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
      { key: "tender", label: "Dolor a la palpación en FID", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
      { key: "wbc", label: "Leucocitos >10.000/µL", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "neut", label: "Neutrófilos >75%", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
    ],
    interpret: (s) => s <= 3 ? "Riesgo bajo; reevaluar y aplicar protocolo pediátrico local." : s <= 6 ? "Riesgo intermedio; considerar observación e imagen." : "Riesgo alto; valoración quirúrgica según protocolo.",
    source: "Samuel — Pediatric Appendicitis Score",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/12037754/",
  },
  "Score de meningitis bacteriana en niños": {
    title: "Bacterial Meningitis Score",
    subtitle: "Niños con pleocitosis de LCR y evaluación apropiada",
    rows: [
      { key: "gram", label: "Tinción de Gram de LCR positiva", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
      { key: "protein", label: "Proteína de LCR ≥80 mg/dL", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "anc", label: "RAN periférico ≥10.000/µL", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "csfanc", label: "RAN en LCR ≥1.000/µL", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "seizure", label: "Convulsión antes o al presentarse", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
    ],
    interpret: (s) => s === 0 ? "Muy bajo riesgo solo si cumple todas las condiciones de aplicación y no existen exclusiones." : "No es de muy bajo riesgo; evaluación y tratamiento conforme a protocolo de meningitis.",
    source: "Nigrovic et al. — derivación/validación del Bacterial Meningitis Score",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/11986445/",
  },
  "Escala de desempeño de Lansky": {
    title: "Escala de desempeño de Lansky",
    subtitle: "Estado funcional pediátrico informado por cuidadores",
    rows: [{ key: "performance", label: "Selecciona la descripción que mejor representa la actividad", options: [
      { label: "100: completamente activo, normal", value: 100 }, { label: "90: restricciones menores en actividad física intensa", value: 90 },
      { label: "80: activo, se cansa con mayor rapidez", value: 80 }, { label: "70: mayores restricciones y menos tiempo de juego", value: 70 },
      { label: "60: activo, pero juego activo mínimo", value: 60 }, { label: "50: se viste, pero descansa gran parte del día", value: 50 },
      { label: "40: principalmente en cama; participa en actividades tranquilas", value: 40 }, { label: "30: necesita ayuda incluso para juego tranquilo", value: 30 },
      { label: "20: duerme con frecuencia; juego muy limitado", value: 20 }, { label: "10: no juega; permanece en cama", value: 10 }, { label: "0: sin respuesta", value: 0 },
    ] }],
    interpret: (s) => s >= 80 ? "Función conservada con limitación nula o leve." : s >= 50 ? "Limitación funcional moderada." : s >= 20 ? "Limitación funcional grave y alta dependencia." : "Dependencia extrema; requiere evaluación clínica inmediata.",
    source: "Lansky Play-Performance Scale; documentar la descripción además del número",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/6634244/",
  },
  "Escala BOPS para dolor posoperatorio pediátrico": {
    title: "Behavioral Observational Pain Scale (BOPS)",
    subtitle: "Evaluación conductual de dolor posoperatorio pediátrico",
    rows: [
      { key: "face", label: "Expresión facial", options: [{ label: "Neutra", value: 0 }, { label: "Mueca leve/intermitente", value: 1 }, { label: "Mueca continua", value: 2 }] },
      { key: "verbal", label: "Vocalización", options: [{ label: "Normal/sin queja", value: 0 }, { label: "Queja o gemido", value: 1 }, { label: "Llanto/grito", value: 2 }] },
      { key: "body", label: "Posición corporal", options: [{ label: "Relajada", value: 0 }, { label: "Inquieta/tensa", value: 1 }, { label: "Rígida o protectora", value: 2 }] },
    ],
    interpret: (s) => s < 2 ? "Dolor ausente o leve por esta escala." : "Dolor clínicamente relevante posible; aplicar protocolo analgésico y reevaluar.",
    source: "BOPS; use la versión validada por su institución y registre cambios tras analgesia",
  },
  "Escala CHEOPS para dolor posoperatorio pediátrico": {
    title: "CHEOPS",
    subtitle: "Children's Hospital of Eastern Ontario Pain Scale",
    rows: [
      { key: "cry", label: "Llanto", options: [{ label: "No llora", value: 1 }, { label: "Gime/llora", value: 2 }, { label: "Grita", value: 3 }] },
      { key: "face", label: "Expresión facial", options: [{ label: "Sonrisa", value: 0 }, { label: "Neutra", value: 1 }, { label: "Mueca", value: 2 }] },
      { key: "verbal", label: "Verbalización", options: [{ label: "Positiva", value: 0 }, { label: "Ninguna/otra queja", value: 1 }, { label: "Queja de dolor", value: 2 }] },
      { key: "torso", label: "Torso", options: [{ label: "Neutro", value: 1 }, { label: "Inquieto/tenso", value: 2 }] },
      { key: "touch", label: "Toca la herida", options: [{ label: "No", value: 1 }, { label: "Alcanza/toca/protege", value: 2 }] },
      { key: "legs", label: "Piernas", options: [{ label: "Neutras", value: 1 }, { label: "Se retuerce/patea/rigidez", value: 2 }] },
    ],
    interpret: (s) => s <= 6 ? "Puntuación baja; continuar observación." : "Dolor posoperatorio relevante posible; tratar según protocolo y reevaluar.",
    source: "CHEOPS; versión y puntos de corte conforme al protocolo pediátrico local",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/6708517/",
  },
  "Score de Glasgow–Blatchford": {
    title: "Glasgow–Blatchford Bleeding Score",
    subtitle: "Estratificación preendoscópica en hemorragia digestiva alta",
    rows: [
      { key: "bun", label: "Urea/BUN equivalente", options: [{ label: "BUN <18,2 mg/dL (<6,5 mmol/L urea)", value: 0 }, { label: "18,2–22,3 mg/dL", value: 2 }, { label: "22,4–27,9 mg/dL", value: 3 }, { label: "28–69,9 mg/dL", value: 4 }, { label: "≥70 mg/dL", value: 6 }] },
      { key: "hb", label: "Hemoglobina y sexo", options: [{ label: "Hombre ≥13 / mujer ≥12 g/dL", value: 0 }, { label: "Hombre 12–12,9 o mujer 10–11,9", value: 1 }, { label: "Hombre 10–11,9", value: 3 }, { label: "Hombre <10 o mujer <10", value: 6 }] },
      { key: "sbp", label: "Presión arterial sistólica", options: [{ label: "≥110 mmHg", value: 0 }, { label: "100–109", value: 1 }, { label: "90–99", value: 2 }, { label: "<90", value: 3 }] },
      { key: "pulse", label: "Pulso ≥100/min", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "melena", label: "Melena", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "syncope", label: "Síncope", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
      { key: "hepatic", label: "Enfermedad hepática", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
      { key: "cardiac", label: "Insuficiencia cardíaca", options: [{ label: "No", value: 0 }, { label: "Sí", value: 2 }] },
    ],
    interpret: (s) => s === 0 ? "Muy bajo riesgo por el umbral clásico; cualquier alta requiere protocolo y evaluación clínica completos." : "No es de muy bajo riesgo; requiere evaluación y manejo de hemorragia digestiva alta según protocolo.",
    source: "Blatchford et al. — score preendoscópico original",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/10638581/",
  },
  "Score simplificado IAIHG": {
    title: "Score simplificado de hepatitis autoinmune",
    subtitle: "International Autoimmune Hepatitis Group",
    rows: [
      { key: "autoantibodies", label: "ANA o SMA (o LKM/SLA)", options: [{ label: "Negativo/bajo", value: 0 }, { label: "ANA/SMA ≥1:40", value: 1 }, { label: "ANA/SMA ≥1:80, LKM ≥1:40 o SLA positivo", value: 2 }] },
      { key: "igg", label: "IgG", options: [{ label: "Normal", value: 0 }, { label: ">LSN", value: 1 }, { label: ">1,10 × LSN", value: 2 }] },
      { key: "histology", label: "Histología hepática", options: [{ label: "Atípica", value: 0 }, { label: "Compatible", value: 1 }, { label: "Típica", value: 2 }] },
      { key: "viral", label: "Ausencia de hepatitis viral", options: [{ label: "No demostrada", value: 0 }, { label: "Demostrada", value: 2 }] },
    ],
    interpret: (s) => s >= 7 ? "Hepatitis autoinmune definida por el score simplificado." : s === 6 ? "Hepatitis autoinmune probable." : "Por debajo del umbral; no excluye enfermedad y requiere evaluación hepatológica.",
    source: "Hennes et al. — criterios IAIHG simplificados",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/18537184/",
  },
  "Score de actividad NAFLD": {
    title: "NAFLD Activity Score (NAS)",
    subtitle: "Puntuación histológica: esteatosis, inflamación y balonización",
    rows: [
      { key: "steatosis", label: "Esteatosis", options: [{ label: "<5%", value: 0 }, { label: "5–33%", value: 1 }, { label: ">33–66%", value: 2 }, { label: ">66%", value: 3 }] },
      { key: "inflammation", label: "Inflamación lobulillar por campo 200×", options: [{ label: "Ningún foco", value: 0 }, { label: "<2 focos", value: 1 }, { label: "2–4 focos", value: 2 }, { label: ">4 focos", value: 3 }] },
      { key: "ballooning", label: "Balonización hepatocitaria", options: [{ label: "Ninguna", value: 0 }, { label: "Pocas células", value: 1 }, { label: "Muchas/prominente", value: 2 }] },
    ],
    interpret: (s) => s >= 5 ? "Actividad alta; NAS no sustituye el diagnóstico histopatológico integrado de esteatohepatitis." : s <= 2 ? "Actividad baja; correlacionar con informe histopatológico completo." : "Zona intermedia; requiere interpretación histopatológica.",
    source: "Kleiner et al. — sistema histológico NASH CRN",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/15915461/",
  },
  "Índice de actividad de colitis ulcerosa pediátrica (PUCAI)": {
    title: "PUCAI",
    subtitle: "Actividad clínica de colitis ulcerosa pediátrica sin pruebas invasivas",
    rows: [
      { key: "pain", label: "Dolor abdominal", options: [{ label: "Ninguno", value: 0 }, { label: "Puede ignorarse", value: 5 }, { label: "No puede ignorarse", value: 10 }] },
      { key: "bleeding", label: "Sangrado rectal", options: [{ label: "Ninguno", value: 0 }, { label: "Pequeña cantidad <50% deposiciones", value: 10 }, { label: "Pequeña cantidad en la mayoría", value: 20 }, { label: "Gran cantidad", value: 30 }] },
      { key: "consistency", label: "Consistencia de deposiciones", options: [{ label: "Formadas", value: 0 }, { label: "Parcialmente formadas", value: 5 }, { label: "Completamente líquidas", value: 10 }] },
      { key: "frequency", label: "Número de deposiciones/24 h", options: [{ label: "0–2", value: 0 }, { label: "3–5", value: 5 }, { label: "6–8", value: 10 }, { label: ">8", value: 15 }] },
      { key: "nocturnal", label: "Deposiciones nocturnas", options: [{ label: "No", value: 0 }, { label: "Sí", value: 10 }] },
      { key: "activity", label: "Nivel de actividad", options: [{ label: "Sin limitación", value: 0 }, { label: "Limitación ocasional", value: 5 }, { label: "Actividad muy restringida", value: 10 }] },
    ],
    interpret: (s) => s < 10 ? "Remisión clínica." : s < 35 ? "Actividad leve." : s < 65 ? "Actividad moderada." : "Actividad grave; requiere evaluación urgente conforme a protocolo pediátrico.",
    source: "Turner et al. — desarrollo y validación del PUCAI",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/17255842/",
  },
  "Score de Eckhardt": {
    title: "Eckardt symptom score",
    subtitle: "Síntomas de acalasia y pérdida de peso",
    rows: [
      { key: "dysphagia", label: "Disfagia", options: [{ label: "Ninguna", value: 0 }, { label: "Ocasional", value: 1 }, { label: "Diaria", value: 2 }, { label: "En cada comida", value: 3 }] },
      { key: "regurgitation", label: "Regurgitación", options: [{ label: "Ninguna", value: 0 }, { label: "Ocasional", value: 1 }, { label: "Diaria", value: 2 }, { label: "En cada comida", value: 3 }] },
      { key: "pain", label: "Dolor retroesternal", options: [{ label: "Ninguno", value: 0 }, { label: "Ocasional", value: 1 }, { label: "Diario", value: 2 }, { label: "En cada comida", value: 3 }] },
      { key: "weight", label: "Pérdida de peso", options: [{ label: "Ninguna", value: 0 }, { label: "<5 kg", value: 1 }, { label: "5–10 kg", value: 2 }, { label: ">10 kg", value: 3 }] },
    ],
    interpret: (s) => s <= 3 ? "Control sintomático habitual por umbral clínico; correlacionar con evaluación objetiva." : "Síntomas persistentes/relevantes; reevaluación especializada.",
    source: "Eckardt score para acalasia; no sustituye manometría ni evaluación especializada",
  },
  "Score pronóstico internacional de Hodgkin infantil (CHIPS)": {
    title: "Childhood Hodgkin International Prognostic Score",
    subtitle: "Factores pronósticos al diagnóstico en linfoma de Hodgkin pediátrico",
    rows: [
      { key: "stage", label: "Estadio IV", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "mediastinal", label: "Adenopatía mediastínica grande", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "albumin", label: "Albúmina <3,5 g/dL", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
      { key: "fever", label: "Fiebre", options: [{ label: "No", value: 0 }, { label: "Sí", value: 1 }] },
    ],
    interpret: (s) => `CHIPS ${s}. La aplicación pronóstica y terapéutica depende del protocolo oncológico contemporáneo; no usar de forma aislada.`,
    source: "CHIPS — modelo pronóstico pediátrico; validar contra el protocolo del grupo cooperativo tratante",
  },
};

const referenceDefinitions: Record<string, ReferenceDefinition> = {
  "Valores normales de TFG": {
    title: "Categorías de filtración glomerular KDIGO",
    subtitle: "Clasificación de eGFR en adultos; requiere contexto de cronicidad y daño renal",
    columns: ["Categoría", "eGFR (mL/min/1,73 m²)", "Descripción"],
    rows: [["G1", "≥90", "Normal o alta"], ["G2", "60–89", "Levemente disminuida"], ["G3a", "45–59", "Leve a moderadamente disminuida"], ["G3b", "30–44", "Moderada a gravemente disminuida"], ["G4", "15–29", "Gravemente disminuida"], ["G5", "<15", "Falla renal"]],
    notes: ["G1 o G2 por sí solas no establecen enfermedad renal crónica sin otros marcadores de daño.", "La clasificación completa combina G (eGFR) y A (albuminuria) y exige persistencia cuando corresponda."],
    source: "KDIGO 2024 Clinical Practice Guideline for CKD",
    sourceUrl: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
  },
  "Frecuencia respiratoria normal": {
    title: "Frecuencia respiratoria de referencia en reposo",
    subtitle: "Rangos orientativos por edad; medir durante un minuto y contextualizar",
    columns: ["Edad", "Respiraciones/min", "Observación"],
    rows: [["Recién nacido", "30–60", "Puede ser irregular"], ["1–12 meses", "30–53", "Medir en calma"], ["1–2 años", "22–37", "Fiebre y llanto elevan la frecuencia"], ["3–5 años", "20–28", "Usar tablas locales"], ["6–11 años", "18–25", "Interpretar con esfuerzo respiratorio"], ["12–17 años", "12–20", "Similar al adulto hacia el final"], ["Adulto", "12–20", "En reposo"]],
    notes: ["Los límites publicados varían según población, estado de vigilia y método.", "Una frecuencia normal no excluye dificultad respiratoria."],
    source: "NCBI Bookshelf — Vital Sign Assessment Across the Lifespan",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK553213/",
  },
  "Niveles terapéuticos de fármacos": {
    title: "Monitorización terapéutica de fármacos",
    subtitle: "Intervalos séricos orientativos; confirmar momento de muestra, método e indicación",
    columns: ["Fármaco", "Intervalo orientativo", "Muestra/nota"],
    rows: [["Litio", "0,6–1,2 mmol/L", "Valle, habitualmente 12 h posdosis"], ["Digoxina", "0,5–0,9 ng/mL en IC", "≥6–8 h posdosis; objetivo depende de indicación"], ["Fenitoína total", "10–20 µg/mL", "Corregir/medir libre con hipoalbuminemia"], ["Valproato total", "50–100 µg/mL", "Objetivo depende de indicación"], ["Carbamazepina", "4–12 µg/mL", "Valle en estado estacionario"], ["Teofilina", "5–15 µg/mL", "Toxicidad aumenta con concentraciones mayores"], ["Vancomicina", "AUC/MIC 400–600", "Preferir monitorización AUC en infecciones graves"]],
    notes: ["No ajustar dosis solo por esta tabla.", "Toxicidad, fracción libre, función renal/hepática e interacciones pueden cambiar la interpretación."],
    source: "NIH/NLM — principios de Therapeutic Drug Monitoring",
    sourceUrl: "https://www.ncbi.nlm.nih.gov/books/NBK557852/",
  },
  "Fármacos a evitar en déficit de G6PD": {
    title: "Riesgo farmacogenético en déficit de G6PD",
    subtitle: "Clasificación CPIC; confirmar variante, actividad enzimática, dosis y contexto",
    columns: ["Riesgo", "Ejemplos", "Conducta general CPIC"],
    rows: [["Alto", "Dapsona, azul de metileno, pegloticase, rasburicasa, tafenoquina, primaquina a dosis estándar", "Evitar en deficiencia de G6PD"], ["Medio", "Nitrofurantoína", "Usar con precaución y vigilancia"], ["Variable por dosis", "Primaquina en pauta semanal", "Solo bajo protocolo y monitorización"]],
    notes: ["Esta lista no sustituye la tabla completa ni la ficha técnica.", "La hemólisis también puede desencadenarse por infección o habas; una prueba durante hemólisis puede ser falsamente normal."],
    source: "CPIC Guideline for Medication Use in the Context of G6PD Genotype",
    sourceUrl: "https://cpicpgx.org/guidelines/cpic-guideline-for-g6pd/",
  },
  "Pruebas de función tiroidea": {
    title: "Pruebas tiroideas frecuentes",
    subtitle: "Intervalos adultos orientativos; usar los impresos por el laboratorio",
    columns: ["Prueba", "Intervalo orientativo", "Unidad/nota"],
    rows: [["TSH", "0,4–4,0", "mUI/L"], ["T4 libre", "0,8–1,8", "ng/dL"], ["T3 libre", "2,3–4,2", "pg/mL"], ["T4 total", "5–12", "µg/dL; cambia con proteínas transportadoras"]],
    notes: ["Embarazo, edad, enfermedad aguda y fármacos requieren intervalos/interpretación específicos.", "TSH y T4 libre deben interpretarse conjuntamente."],
    source: "American Thyroid Association — pruebas de función tiroidea",
    sourceUrl: "https://www.thyroid.org/thyroid-function-tests/",
  },
  "Química clínica": {
    title: "Química clínica básica",
    subtitle: "Intervalos adultos orientativos; prevalece el rango del laboratorio",
    columns: ["Analito", "Intervalo orientativo", "Unidad"],
    rows: [["Sodio", "135–145", "mmol/L"], ["Potasio", "3,5–5,0", "mmol/L"], ["Cloro", "98–106", "mmol/L"], ["Bicarbonato", "22–29", "mmol/L"], ["Glucosa en ayunas", "70–99", "mg/dL"], ["Calcio total", "8,5–10,5", "mg/dL"], ["Magnesio", "1,7–2,2", "mg/dL"], ["Fósforo", "2,5–4,5", "mg/dL"]],
    notes: ["Los intervalos pediátricos y neonatales difieren.", "La interpretación depende de método, muestra, albúmina, pH y estado clínico."],
    source: "NIH MedlinePlus — pruebas metabólicas y electrolitos",
    sourceUrl: "https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/",
  },
  "Perfil de coagulación": {
    title: "Perfil de coagulación",
    subtitle: "Intervalos adultos orientativos sin anticoagulación",
    columns: ["Prueba", "Intervalo orientativo", "Nota"],
    rows: [["TP", "11–13,5 s", "Dependiente del reactivo"], ["INR", "0,8–1,1", "Objetivos terapéuticos son distintos"], ["TTPa", "25–35 s", "Dependiente del reactivo"], ["Fibrinógeno", "200–400 mg/dL", "Método de Clauss habitual"], ["Plaquetas", "150–450 ×10³/µL", "No evalúa función plaquetaria"]],
    notes: ["Utilice los intervalos y controles del laboratorio local.", "Anticoagulantes, hepatopatía, consumo y deficiencias afectan patrones de forma distinta."],
    source: "NIH MedlinePlus — pruebas de coagulación",
    sourceUrl: "https://medlineplus.gov/lab-tests/prothrombin-time-test-and-inr-ptinr/",
  },
  "Valores normales de albúmina": {
    title: "Albúmina sérica",
    subtitle: "Referencia general; no es un marcador nutricional aislado",
    columns: ["Población/muestra", "Intervalo orientativo", "Unidad"],
    rows: [["Adulto", "3,5–5,0", "g/dL"], ["Niño", "≈3,8–5,4", "g/dL; depende de edad/laboratorio"], ["Líquido ascítico", "Interpretar con albúmina sérica", "Calcular GASA"]],
    notes: ["Inflamación, pérdidas, síntesis hepática y distribución alteran la concentración.", "Use muestras sérica y ascítica del mismo día para GASA."],
    source: "NIH MedlinePlus — Albumin Blood Test",
    sourceUrl: "https://medlineplus.gov/lab-tests/albumin-blood-test/",
  },
  "Valores normales de ALT, AST y GGT": {
    title: "Enzimas hepáticas",
    subtitle: "Intervalos orientativos; varían por sexo, edad, método y laboratorio",
    columns: ["Prueba", "Intervalo adulto aproximado", "Unidad"],
    rows: [["ALT", "7–55", "U/L"], ["AST", "8–48", "U/L"], ["GGT", "9–48", "U/L; fuerte variación por sexo/laboratorio"]],
    notes: ["Una concentración dentro del rango no excluye enfermedad hepática.", "Interprete patrón, magnitud, bilirrubina, fosfatasa alcalina y contexto."],
    source: "NIH MedlinePlus — Liver Function Tests",
    sourceUrl: "https://medlineplus.gov/lab-tests/liver-function-tests/",
  },
  "Valores normales de lactato deshidrogenasa": {
    title: "Lactato deshidrogenasa (LDH)",
    subtitle: "Marcador inespecífico de daño tisular",
    columns: ["Muestra", "Intervalo orientativo", "Observación"],
    rows: [["Suero adulto", "≈140–280 U/L", "Depende ampliamente del método"], ["Muestra hemolizada", "Puede elevarse falsamente", "Revisar índice de hemólisis"]],
    notes: ["La LDH no localiza por sí sola el origen del daño.", "Use el intervalo exacto del laboratorio."],
    source: "NIH MedlinePlus — LDH Test",
    sourceUrl: "https://medlineplus.gov/lab-tests/lactate-dehydrogenase-ldh-test/",
  },
  "Requerimientos de proteínas por edad": {
    title: "Ingesta dietética recomendada de proteína",
    subtitle: "Valores de referencia poblacionales; no son prescripción para enfermedad crítica",
    columns: ["Grupo", "Proteína", "Unidad"],
    rows: [["0–6 meses", "1,52", "g/kg/día (AI)"], ["7–12 meses", "1,2", "g/kg/día"], ["1–3 años", "1,05", "g/kg/día"], ["4–13 años", "0,95", "g/kg/día"], ["14–18 años", "0,85", "g/kg/día"], ["Adultos", "0,80", "g/kg/día"], ["Embarazo", "1,10", "g/kg/día"], ["Lactancia", "1,30", "g/kg/día"]],
    notes: ["En prematuridad, enfermedad renal/hepática, quemaduras o catabolismo se requieren objetivos específicos.", "Ajustar por peso apropiado y valoración nutricional."],
    source: "National Academies — Dietary Reference Intakes for Protein",
    sourceUrl: "https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids",
  },
};

const tools: ClinicalTool[] = Object.entries(catalogSource).flatMap(([category, names]) =>
  names.map((name) => ({
    id: slugify(category + "-" + name),
    name,
    category,
    kind: inferKind(name),
    code: name.match(/\(([^)]+)\)/)?.[1]?.slice(0, 7).toUpperCase() || name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase(),
    featured: featuredNames.has(name),
  })),
);

const quickReference = [
  { label: "Sodio", value: "135–145", unit: "mmol/L" },
  { label: "Potasio", value: "3,5–5,0", unit: "mmol/L" },
  { label: "Glucosa en ayunas", value: "70–99", unit: "mg/dL" },
  { label: "Plaquetas", value: "150–450", unit: "10³/µL" },
  { label: "Hemoglobina adulta", value: "≈ 12–17,5", unit: "g/dL" },
  { label: "pH arterial", value: "7,35–7,45", unit: "" },
];

const kindLabels: Record<ToolKind, string> = { calculator: "Calculadora", score: "Score", reference: "Tabla", algorithm: "Algoritmo", guide: "Guía clínica" };
const savePreference = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Safari private mode or disabled storage */ } };
const categoryUtilities: Record<string, string> = {
  "Crecimiento": "apoyar la valoración antropométrica, nutricional o del desarrollo",
  "Conversiones": "convertir magnitudes sin cambiar su significado clínico",
  "Renal": "cuantificar función renal, manejo tubular o equilibrio hidroelectrolítico",
  "Embarazo": "apoyar la datación y evaluación obstétrica o neonatal",
  "Cuidados críticos": "resumir variables fisiológicas y apoyar la vigilancia de pacientes críticos",
  "Cardiovascular": "apoyar la evaluación hemodinámica y cardiovascular",
  "Fármacos": "comparar dosis, concentraciones o equivalencias farmacológicas",
  "Fluidos IV": "planificar y comprobar aportes de fluidos, glucosa o infusiones",
  "Valores sanguíneos": "interpretar recuentos e índices derivados del laboratorio",
  "Endocrinología": "interpretar parámetros metabólicos y endocrinos",
  "Cirugía": "estandarizar la evaluación perioperatoria",
  "Polisomnografía": "resumir eventos respiratorios y oxigenación durante el sueño",
  "Neurología": "estandarizar hallazgos neurológicos y del líquido cefalorraquídeo",
  "Gastro y hepatología": "estratificar actividad, gravedad o función gastrointestinal y hepática",
  "Nutrición": "orientar requerimientos e interpretación nutricional",
  "Neonatología": "apoyar la evaluación y dosificación específicas del recién nacido",
  "Dolor": "hacer el dolor observable, comparable y reevaluable",
  "Reumatología": "cuantificar actividad, síntomas o criterios reumatológicos",
  "Infecciosas": "estratificar probabilidad o gravedad de síndromes infecciosos",
  "Obstetricia": "estandarizar la evaluación del parto y sus probabilidades",
  "Respiratorio": "cuantificar función, gravedad o riesgo respiratorio",
  "Radiología": "apoyar decisiones de imagen mediante criterios estructurados",
  "Psicosocial": "organizar criterios clínicos sin sustituir una entrevista diagnóstica",
  "Oncología": "estandarizar pronóstico, estadificación y seguimiento oncológico",
  "Hematología": "cuantificar parámetros celulares, transfusionales o hematológicos",
};

export default function ClinicalApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [selected, setSelected] = useState<ClinicalTool | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [dark, setDark] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        setFavorites(JSON.parse(localStorage.getItem("calcmed-favorites") || "[]"));
        setRecent(JSON.parse(localStorage.getItem("calcmed-recent") || "[]"));
        setDark(localStorage.getItem("calcmed-dark") === "true");
        setCompact(localStorage.getItem("calcmed-compact") === "true");
      } catch { /* local preferences are optional */ }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    savePreference("calcmed-dark", String(dark));
  }, [dark]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (process.env.NODE_ENV === "production" && !isLocal) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => undefined);
      return;
    }
    navigator.serviceWorker.getRegistrations().then((registrations) => registrations.forEach((registration) => registration.unregister()));
    if ("caches" in window) caches.keys().then((keys) => keys.filter((key) => key.startsWith("calcmed-")).forEach((key) => caches.delete(key)));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const categoryMatch = category === "Todas" || tool.category === category;
      const searchMatch = !normalized || (tool.name + " " + tool.category + " " + tool.code).toLowerCase().includes(normalized);
      const favoriteMatch = screen !== "favorites" || favorites.includes(tool.id);
      return categoryMatch && searchMatch && favoriteMatch;
    });
  }, [query, category, screen, favorites]);

  const featured = tools.filter((tool) => tool.featured).slice(0, 8);
  const recentTools = recent.map((id) => tools.find((tool) => tool.id === id)).filter(Boolean) as ClinicalTool[];

  const openTool = (tool: ClinicalTool) => {
    const updated = [tool.id, ...recent.filter((id) => id !== tool.id)].slice(0, 8);
    setRecent(updated);
    savePreference("calcmed-recent", JSON.stringify(updated));
    setSelected(tool);
  };

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id) ? favorites.filter((item) => item !== id) : [id, ...favorites];
    setFavorites(updated);
    savePreference("calcmed-favorites", JSON.stringify(updated));
  };

  const go = (next: Screen) => {
    setScreen(next);
    setMenuOpen(false);
    if (next === "favorites") setCategory("Todas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={"app-shell " + (compact ? "compact" : "")}>
      <header className="topbar">
        <div className="topbar-inner">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu size={22} /></button>
          <button className="brand" onClick={() => go("home")} aria-label="Ir al inicio">
            <span className="brand-mark"><Activity size={23} strokeWidth={2.5} /></span>
            <span><strong>Calc</strong><em>Med</em></span>
          </button>
          <div className="header-search">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setScreen("catalog")} placeholder="Buscar calculadora, score o criterio…" aria-label="Buscar herramientas clínicas" />
            {query && <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X size={16} /></button>}
          </div>
          <div className="top-actions">
            <button className="icon-button" onClick={() => setDark(!dark)} aria-label={dark ? "Activar tema claro" : "Activar tema oscuro"}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
            <button className="avatar" onClick={() => go("settings")} aria-label="Preferencias">ML</button>
          </div>
        </div>
      </header>

      <div className={"drawer-backdrop " + (menuOpen ? "visible" : "")} onClick={() => setMenuOpen(false)} />
      <aside className={"drawer " + (menuOpen ? "open" : "")} aria-hidden={!menuOpen}>
        <div className="drawer-head">
          <div className="brand"><span className="brand-mark"><Activity size={23} /></span><span><strong>Calc</strong><em>Med</em></span></div>
          <button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X size={20} /></button>
        </div>
        <p className="drawer-label">ESPACIO CLÍNICO</p>
        <nav className="drawer-nav">
          <button className={screen === "home" ? "active" : ""} onClick={() => go("home")}><Home size={19} /> Inicio</button>
          <button className={screen === "catalog" ? "active" : ""} onClick={() => go("catalog")}><Calculator size={19} /> Todas las herramientas <span>{tools.length}</span></button>
          <button onClick={() => { go("catalog"); setCategory("Todas"); }}><ListFilter size={19} /> Por especialidad <span>{Object.keys(catalogSource).length}</span></button>
          <button className={screen === "favorites" ? "active" : ""} onClick={() => go("favorites")}><Star size={19} /> Favoritos <span>{favorites.length}</span></button>
          <button className={screen === "settings" ? "active" : ""} onClick={() => go("settings")}><Settings size={19} /> Preferencias</button>
        </nav>
        <div className="drawer-safety"><ShieldCheck size={20} /><div><strong>Uso clínico responsable</strong><p>Resultados orientativos. Confirme siempre con guías vigentes y protocolos locales.</p></div></div>
        <div className="drawer-footer"><span className="status-dot" /> Catálogo clínico disponible offline</div>
      </aside>

      <main>
        {screen === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow"><span><Zap size={14} fill="currentColor" /> Soporte clínico rápido</span><span className="version-pill">Edición 2026</span></div>
                <p>Calculadoras, scores, algoritmos y valores de referencia reunidos en un espacio preciso, ágil y diseñado para la práctica diaria.</p>
                <div className="hero-search">
                  <Search size={20} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setScreen("catalog")} placeholder="¿Qué necesitas calcular?" aria-label="Buscar desde inicio" />
                  <button onClick={() => setScreen("catalog")}>Buscar</button>
                </div>
                <div className="hero-stats">
                  <div><strong>{tools.length}</strong><span>herramientas</span></div>
                  <div><strong>{Object.keys(catalogSource).length}</strong><span>especialidades</span></div>
                  <div><strong>100%</strong><span>sin registro</span></div>
                </div>
              </div>
              <div className="hero-panel">
                <div className="panel-top"><span><Stethoscope size={18} /> Acceso rápido</span><small>HOY</small></div>
                <div className="mini-tool" onClick={() => openTool(tools.find((t) => t.name === "Índice de masa corporal (IMC)")!)}>
                  <span className="mini-icon mint"><Activity size={20} /></span><div><strong>Índice de masa corporal</strong><small>Crecimiento · Calculadora</small></div><ChevronRight size={18} />
                </div>
                <div className="mini-tool" onClick={() => openTool(tools.find((t) => t.name === "Score APGAR")!)}>
                  <span className="mini-icon coral"><Baby size={20} /></span><div><strong>Score APGAR</strong><small>Neonatología · Score</small></div><ChevronRight size={18} />
                </div>
                <div className="mini-tool" onClick={() => openTool(tools.find((t) => t.name === "Presión arterial media (PAM)")!)}>
                  <span className="mini-icon blue"><HeartPulse size={20} /></span><div><strong>Presión arterial media</strong><small>Cuidados críticos · Calculadora</small></div><ChevronRight size={18} />
                </div>
                <button className="panel-cta" onClick={() => go("catalog")}>Ver catálogo completo <ChevronRight size={17} /></button>
              </div>
            </section>

            <section className="content-section">
              <div className="section-heading"><div><span className="kicker">MÁS UTILIZADAS</span><h2>Herramientas esenciales</h2></div><button onClick={() => go("catalog")}>Explorar todas <ChevronRight size={16} /></button></div>
              <div className="featured-grid">
                {featured.map((tool) => <ToolCard key={tool.id} tool={tool} favorite={favorites.includes(tool.id)} onOpen={() => openTool(tool)} onFavorite={() => toggleFavorite(tool.id)} />)}
              </div>
            </section>

            <section className="specialty-band">
              <div className="section-heading"><div><span className="kicker">NAVEGA POR CONTEXTO</span><h2>Especialidades</h2></div></div>
              <div className="specialty-grid">
                {Object.entries(catalogSource).slice(0, 8).map(([name, items]) => {
                  const meta = categoryMeta[name]; const Icon = meta.icon;
                  return <button key={name} className="specialty-card" onClick={() => { setCategory(name); go("catalog"); }}><span className={"category-icon " + meta.tint}><Icon size={21} /></span><span><strong>{name}</strong><small>{items.length} herramientas</small></span><ChevronRight size={17} /></button>;
                })}
              </div>
            </section>

            <section className="dashboard-row">
              <div className="reference-card">
                <div className="card-title"><span><BookOpen size={19} /> Referencias rápidas</span><small>ADULTOS · ORIENTATIVO</small></div>
                <div className="reference-table">{quickReference.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.unit}</small></div>)}</div>
                <p>Los intervalos pueden variar según laboratorio, método, edad y contexto clínico.</p>
              </div>
              <div className="recent-card">
                <div className="card-title"><span><Clock3 size={19} /> Vistos recientemente</span></div>
                {recentTools.length ? recentTools.slice(0, 4).map((tool) => <button key={tool.id} onClick={() => openTool(tool)}><ToolGlyph tool={tool} /><span><strong>{tool.name}</strong><small>{tool.category}</small></span><ChevronRight size={16} /></button>) : <div className="empty-mini"><Clock3 size={27} /><p>Tus herramientas recientes aparecerán aquí.</p></div>}
              </div>
            </section>
          </>
        )}

        {(screen === "catalog" || screen === "favorites") && (
          <section className="catalog-page">
            <div className="catalog-hero">
              <div><span className="kicker">BIBLIOTECA CLÍNICA</span><h1>{screen === "favorites" ? "Tus favoritos" : "Todas las herramientas"}</h1><p>{screen === "favorites" ? "Tu selección personal, disponible en este dispositivo." : "Explora el catálogo completo de las capturas de referencia, organizado para encontrar respuestas rápidamente."}</p></div>
              <div className="catalog-count"><strong>{filtered.length}</strong><span>resultados</span></div>
            </div>
            <div className="catalog-controls">
              <div className="catalog-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, sigla o especialidad…" /></div>
              <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filtrar por especialidad"><option>Todas</option>{Object.keys(catalogSource).map((name) => <option key={name}>{name}</option>)}</select>
            </div>
            <div className="category-chips"><button className={category === "Todas" ? "active" : ""} onClick={() => setCategory("Todas")}>Todas</button>{Object.keys(catalogSource).slice(0, 12).map((name) => <button key={name} className={category === name ? "active" : ""} onClick={() => setCategory(name)}>{name}</button>)}</div>
            {filtered.length ? <div className="tool-list">{filtered.map((tool) => <ToolRow key={tool.id} tool={tool} favorite={favorites.includes(tool.id)} onOpen={() => openTool(tool)} onFavorite={() => toggleFavorite(tool.id)} />)}</div> : <div className="empty-state"><Search size={32} /><h3>No encontramos coincidencias</h3><p>Prueba otro término o elimina los filtros activos.</p><button onClick={() => { setQuery(""); setCategory("Todas"); }}>Limpiar filtros</button></div>}
          </section>
        )}

        {screen === "settings" && (
          <section className="settings-page">
            <span className="kicker">PREFERENCIAS</span><h1>Tu espacio clínico</h1><p className="settings-lead">Ajusta la experiencia en este dispositivo. No almacenamos información de pacientes ni enviamos datos a servidores externos.</p>
            <div className="settings-grid">
              <div className="settings-card"><div><Moon size={20} /><span><strong>Tema oscuro</strong><small>Reduce el brillo en entornos con poca luz.</small></span></div><button className={"switch " + (dark ? "on" : "")} onClick={() => setDark(!dark)} aria-pressed={dark}><span /></button></div>
              <div className="settings-card"><div><ListFilter size={20} /><span><strong>Vista compacta</strong><small>Muestra más herramientas por pantalla.</small></span></div><button className={"switch " + (compact ? "on" : "")} onClick={() => { setCompact(!compact); savePreference("calcmed-compact", String(!compact)); }} aria-pressed={compact}><span /></button></div>
              <div className="settings-card"><div><Star size={20} /><span><strong>Favoritos guardados</strong><small>{favorites.length} herramientas en este dispositivo.</small></span></div><button className="text-button" onClick={() => { setFavorites([]); savePreference("calcmed-favorites", "[]"); }}>Vaciar</button></div>
              <div className="settings-card"><div><Clock3 size={20} /><span><strong>Historial reciente</strong><small>{recent.length} herramientas recientes.</small></span></div><button className="text-button" onClick={() => { setRecent([]); savePreference("calcmed-recent", "[]"); }}>Vaciar</button></div>
            </div>
            <div className="install-card"><span className="install-icon"><Sparkles size={22} /></span><div><h2>Instalar CalcMed en iPhone o iPad</h2><p>Abre la app en Safari, toca <strong>Compartir</strong> y elige <strong>Agregar a pantalla de inicio</strong>. Se abrirá como una app independiente y conservará tus favoritos.</p></div></div>
            <div className="safety-card"><ShieldCheck size={28} /><div><h2>Seguridad y alcance</h2><p>CalcMed es una ayuda de cálculo y consulta. No diagnostica, no prescribe y no reemplaza el juicio clínico. Verifica unidades, datos de entrada, población aplicable y protocolos institucionales antes de actuar.</p></div></div>
            <div className="sources-card">
              <span className="kicker">FUENTES INSTITUCIONALES</span><h2>Base clínica confiable</h2><p>Las herramientas interactivas muestran fórmula, alcance y advertencias. Para áreas que cambian con nuevas versiones, CalcMed enlaza a organismos y guías primarias.</p>
              <div><a href="https://www.cdc.gov/growth-chart-training/hcp/using-bmi/calculating-bmi.html" target="_blank" rel="noreferrer">CDC · IMC y crecimiento</a><a href="https://www.who.int/tools/child-growth-standards/standards" target="_blank" rel="noreferrer">OMS · Estándares de crecimiento</a><a href="https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2015/10/the-apgar-score" target="_blank" rel="noreferrer">ACOG/AAP · APGAR</a><a href="https://kdigo.org/guidelines/ckd-evaluation-and-management/" target="_blank" rel="noreferrer">KDIGO · Guía ERC 2024</a><a href="https://www.aasld.org/practice-guidelines" target="_blank" rel="noreferrer">AASLD · Guías hepatológicas</a><a href="https://www.nice.org.uk/guidance/ng84/chapter/Recommendations" target="_blank" rel="noreferrer">NICE · Centor/FeverPAIN</a></div>
            </div>
          </section>
        )}
      </main>

      <nav className="mobile-nav">
        <button className={screen === "home" ? "active" : ""} onClick={() => go("home")}><Home size={19} /><span>Inicio</span></button>
        <button className={screen === "catalog" ? "active" : ""} onClick={() => go("catalog")}><Calculator size={19} /><span>Calcular</span></button>
        <button className={screen === "favorites" ? "active" : ""} onClick={() => go("favorites")}><Star size={19} /><span>Favoritos</span></button>
        <button className={screen === "settings" ? "active" : ""} onClick={() => go("settings")}><Settings size={19} /><span>Ajustes</span></button>
      </nav>

      {selected && <ToolSheet key={selected.id} tool={selected} favorite={favorites.includes(selected.id)} onFavorite={() => toggleFavorite(selected.id)} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ToolGlyph({ tool }: { tool: ClinicalTool }) {
  const meta = categoryMeta[tool.category] || { tint: "blue" };
  return <span className={"tool-glyph " + meta.tint}>{tool.code.slice(0, 6)}</span>;
}

function ToolCard({ tool, favorite, onOpen, onFavorite }: { tool: ClinicalTool; favorite: boolean; onOpen: () => void; onFavorite: () => void }) {
  return <article className="tool-card" onClick={onOpen}>
    <div className="tool-card-top"><ToolGlyph tool={tool} /><button className={favorite ? "favorite active" : "favorite"} onClick={(e) => { e.stopPropagation(); onFavorite(); }} aria-label="Marcar favorito"><Star size={17} fill={favorite ? "currentColor" : "none"} /></button></div>
    <div><span className="kind-label">{kindLabels[tool.kind]}</span><h3>{tool.name}</h3><p>{tool.category}</p></div>
    <button className="open-link">Abrir herramienta <ChevronRight size={15} /></button>
  </article>;
}

function ToolRow({ tool, favorite, onOpen, onFavorite }: { tool: ClinicalTool; favorite: boolean; onOpen: () => void; onFavorite: () => void }) {
  return <article className="tool-row" onClick={onOpen}><ToolGlyph tool={tool} /><div className="tool-row-copy"><h3>{tool.name}</h3><p><span>{kindLabels[tool.kind]}</span> · {tool.category}</p></div>{calculators[tool.name] || scores[tool.name] ? <span className="ready-badge">Interactiva</span> : referenceDefinitions[tool.name] ? <span className="table-badge">Tabla clínica</span> : <span className="guide-badge">Guía</span>}<button className={favorite ? "favorite active" : "favorite"} onClick={(e) => { e.stopPropagation(); onFavorite(); }} aria-label="Marcar favorito"><Star size={17} fill={favorite ? "currentColor" : "none"} /></button><ChevronRight className="row-arrow" size={18} /></article>;
}

function ToolSheet({ tool, favorite, onFavorite, onClose }: { tool: ClinicalTool; favorite: boolean; onFavorite: () => void; onClose: () => void }) {
  const definition = calculators[tool.name];
  const scoreDefinition = scores[tool.name];
  const [values, setValues] = useState<Record<string, string>>({});
  const [scoreValues, setScoreValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ value: string; unit?: string; interpretation: string } | null>(null);

  const score = scoreDefinition ? Object.values(scoreValues).reduce((a, b) => a + b, 0) : 0;
  const scoreComplete = Boolean(scoreDefinition?.rows.every((row) => Object.prototype.hasOwnProperty.call(scoreValues, row.key)));

  const calculate = () => {
    if (!definition) return;
    const required = definition.fields.every((field) => values[field.key] !== undefined && values[field.key] !== "");
    if (!required) { setResult({ value: "—", interpretation: "Completa todos los campos para calcular." }); return; }
    const valid = definition.fields.every((field) => {
      if (field.type === "select") return field.options?.some((option) => option.value === values[field.key]);
      if (field.type === "date") return !Number.isNaN(new Date(values[field.key] + "T12:00:00").getTime());
      const value = Number(values[field.key]);
      return Number.isFinite(value) && (field.min === undefined || value >= field.min) && (field.max === undefined || value <= field.max);
    });
    if (!valid) { setResult({ value: "—", interpretation: "Revisa los valores y los límites permitidos de cada campo." }); return; }
    try {
      const output = definition.calculate(values);
      if (output.value.includes("NaN") || output.value.includes("Infinity")) setResult({ value: "—", interpretation: "Revisa los valores ingresados." }); else setResult(output);
    } catch {
      setResult({ value: "—", interpretation: "No fue posible calcular con estos datos. Revisa las entradas." });
    }
  };

  return <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={tool.name}>
    <div className="sheet-backdrop" onClick={onClose} />
    <section className="tool-sheet">
      <div className="sheet-handle" />
      <header className="sheet-header"><div className="sheet-title"><ToolGlyph tool={tool} /><div><span>{tool.category} · {kindLabels[tool.kind]}</span><h2>{tool.name}</h2></div></div><div><button className={favorite ? "icon-button active-star" : "icon-button"} onClick={onFavorite} aria-label="Marcar favorito"><Star size={19} fill={favorite ? "currentColor" : "none"} /></button><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button></div></header>

      <div className="sheet-body">
        {definition && <>
          <div className="tool-intro"><Calculator size={21} /><div><strong>{definition.title}</strong><p>{definition.subtitle}</p></div></div>
          <div className="calc-form">{definition.fields.map((field) => <label key={field.key}><span>{field.label}{field.unit && <small>{field.unit}</small>}</span>{field.type === "select" ? <select value={values[field.key] || ""} onChange={(e) => { setValues({ ...values, [field.key]: e.target.value }); setResult(null); }}><option value="">Seleccionar</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type || "number"} inputMode={field.type === "date" ? undefined : "decimal"} value={values[field.key] || ""} min={field.min} max={field.max} step={field.step} placeholder={field.placeholder} onChange={(e) => { setValues({ ...values, [field.key]: e.target.value }); setResult(null); }} />}</label>)}</div>
          <button className="calculate-button" onClick={calculate}><Zap size={18} fill="currentColor" /> Calcular resultado</button>
          {result && <><div className="result-card"><span>RESULTADO</span><div><strong>{result.value}</strong>{result.unit && <em>{result.unit}</em>}</div><p>{result.interpretation}</p></div><ExplanationCard meaning={`${definition.title} expresa ${definition.subtitle.toLowerCase()} a partir de ${definition.fields.map((field) => field.label.toLowerCase()).join(", ")}.`} utility={`Sirve para ${categoryUtilities[tool.category] || "apoyar una valoración clínica estructurada"}. Interprétala junto con la evolución y el contexto del paciente.`} /></>}
          <div className="formula-card"><span>FÓRMULA</span><code>{definition.formula}</code><p>{definition.sourceUrl ? <a href={definition.sourceUrl} target="_blank" rel="noreferrer">{definition.source}</a> : definition.source}</p></div>
        </>}

        {scoreDefinition && <>
          <div className="tool-intro"><ListFilter size={21} /><div><strong>{scoreDefinition.title}</strong><p>{scoreDefinition.subtitle}</p></div></div>
          <div className="score-table">{scoreDefinition.rows.map((row) => <div className="score-row" key={row.key}><strong>{row.label}</strong><div>{row.options.map((option) => <button key={option.label} className={scoreValues[row.key] === option.value ? "selected" : ""} onClick={() => setScoreValues({ ...scoreValues, [row.key]: option.value })}><span>{option.label}</span><em>{option.value > 0 ? "+" : ""}{option.value}</em></button>)}</div></div>)}</div>
          <div className={"score-result " + (!scoreComplete ? "incomplete" : "")}><div><span>PUNTUACIÓN</span><strong>{scoreComplete ? score : "—"}</strong><small>{scoreComplete ? "puntos" : `${Object.keys(scoreValues).length}/${scoreDefinition.rows.length}`}</small></div><p>{scoreComplete ? scoreDefinition.interpret(score) : "Selecciona una opción en cada parámetro para obtener e interpretar la puntuación."}</p></div>
          {scoreComplete && <ExplanationCard meaning={`${scoreDefinition.title} integra ${scoreDefinition.rows.length} parámetros clínicos en una puntuación reproducible.`} utility={`Sirve para ${categoryUtilities[tool.category] || "apoyar una valoración clínica estructurada"} y comunicar el resultado de forma estandarizada.`} />}
          <div className="formula-card"><span>REFERENCIA</span><p>{scoreDefinition.sourceUrl ? <a href={scoreDefinition.sourceUrl} target="_blank" rel="noreferrer">{scoreDefinition.source}</a> : scoreDefinition.source}</p></div>
        </>}

        {!definition && !scoreDefinition && <ReferencePanel tool={tool} />}
        <div className="clinical-warning"><CircleHelp size={19} /><p><strong>Ayuda a la decisión, no decisión automática.</strong> Verifica población aplicable, unidades y datos de entrada. Ante discordancia, prioriza evaluación clínica y protocolos institucionales.</p></div>
      </div>
    </section>
  </div>;
}

function ExplanationCard({ meaning, utility }: { meaning: string; utility: string }) {
  return <div className="explanation-card"><div><span>QUÉ SIGNIFICA</span><p>{meaning}</p></div><div><span>PARA QUÉ SIRVE</span><p>{utility}</p></div></div>;
}

function ReferencePanel({ tool }: { tool: ClinicalTool }) {
  const reference = referenceDefinitions[tool.name];
  if (reference) return <>
    <div className="tool-intro"><BookOpen size={21} /><div><strong>{reference.title}</strong><p>{reference.subtitle}</p></div></div>
    <div className="clinical-table-wrap"><table className="clinical-table"><thead><tr>{reference.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{reference.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>
    <ExplanationCard meaning={`${reference.title} organiza ${reference.rows.length} filas de referencia para una consulta rápida y comparable.`} utility={`Sirve para ${categoryUtilities[tool.category] || "apoyar una valoración clínica estructurada"}; siempre prevalecen el intervalo, método o protocolo aplicable al paciente.`} />
    <div className="guide-steps"><h4>Interpretación segura</h4><ul>{reference.notes.map((note) => <li key={note}>{note}</li>)}</ul></div>
    <div className="formula-card"><span>FUENTE</span><p>{reference.sourceUrl ? <a href={reference.sourceUrl} target="_blank" rel="noreferrer">{reference.source}</a> : reference.source}</p></div>
  </>;
  return <>
    <div className="tool-intro"><BookOpen size={21} /><div><strong>Ficha clínica estructurada</strong><p>{kindLabels[tool.kind]} de {tool.category}</p></div></div>
    <div className="guide-hero"><div className="guide-symbol"><ToolGlyph tool={tool} /></div><span>CONSULTA RÁPIDA</span><h3>{tool.name}</h3><p>Esta entrada forma parte del catálogo fidedigno de la referencia. Su aplicación exacta depende de población, versión de la guía y contexto asistencial.</p></div>
    <div className="guide-grid"><div><span>TIPO</span><strong>{kindLabels[tool.kind]}</strong></div><div><span>ÁREA</span><strong>{tool.category}</strong></div><div><span>USO</span><strong>Apoyo clínico</strong></div><div><span>VALIDACIÓN</span><strong>Protocolo local</strong></div></div>
    <div className="guide-steps"><h4>Antes de utilizarla</h4><ol><li>Confirma que la edad y población del paciente coincidan con la herramienta.</li><li>Revisa la versión y los criterios vigentes de tu institución.</li><li>Documenta componentes y hallazgos, no solo la puntuación final.</li></ol></div>
  </>;
}
