export interface SampleAbstract {
  id: string;
  title: string;
  topic: string;
  text: string;
}

export const SAMPLES: SampleAbstract[] = [
  {
    id: "oncology",
    title: "Adjuvant Immunotherapy in Resected Stage III Melanoma",
    topic: "Oncology",
    text: `[SYNTHETIC DEMO DATA — not a real study or citation]

Title: Adjuvant Pembrolizumab-Based Immunotherapy in Resected Stage III Melanoma: A Synthetic Randomized Controlled Trial

Background: Patients with resected stage III cutaneous melanoma remain at high risk of recurrence despite complete surgical resection. Adjuvant immune checkpoint inhibition may reduce recurrence, but its magnitude of benefit and safety profile in this synthetic setting require evaluation.

Methods: We conducted a synthetic multicenter, double-blind, placebo-controlled randomized controlled trial. A total of n=842 adults with completely resected stage III melanoma were randomly assigned 1:1 to receive adjuvant pembrolizumab (200 mg intravenously every 3 weeks) or matching placebo for up to 12 months. The primary endpoint was recurrence-free survival (RFS). Secondary endpoints included distant metastasis-free survival and safety.

Results: After a median follow-up of 36 months, recurrence-free survival was significantly longer in the pembrolizumab group than in the placebo group (hazard ratio HR=0.58, 95% CI 0.46-0.73, p<0.001). The estimated 3-year RFS was 64% in the pembrolizumab group versus 44% in the placebo group. Grade 3 or higher treatment-related adverse events occurred in 17% of patients receiving pembrolizumab compared with 6% receiving placebo. Immune-related adverse events were consistent with the known class effect.

Conclusion: In this synthetic trial, adjuvant pembrolizumab significantly prolonged recurrence-free survival compared with placebo among patients with resected stage III melanoma, with a higher incidence of grade 3+ adverse events. These findings suggest a potential adjuvant benefit that would require confirmation in longer-term overall survival analyses.`,
  },
  {
    id: "cardiology",
    title: "SGLT2 Inhibition in Heart Failure with Reduced Ejection Fraction",
    topic: "Cardiology",
    text: `[SYNTHETIC DEMO DATA — not a real study or citation]

Title: Empagliflozin Versus Placebo for Heart Failure with Reduced Ejection Fraction: A Synthetic Randomized Controlled Trial

Background: Sodium-glucose cotransporter-2 (SGLT2) inhibitors have shown cardiovascular benefit in several populations. Whether empagliflozin reduces cardiovascular events in patients with chronic heart failure and reduced ejection fraction is evaluated in this synthetic study.

Methods: In a synthetic prospective, double-blind, placebo-controlled randomized controlled trial, n=3,626 adults with chronic heart failure (New York Heart Association class II-IV) and a left ventricular ejection fraction of 40% or less were randomized 1:1 to empagliflozin 10 mg once daily or placebo, in addition to guideline-directed therapy. The primary composite outcome was cardiovascular death or hospitalization for heart failure. Median follow-up was 21 months.

Results: A primary outcome event occurred in 361 of 1,813 patients (19.9%) in the empagliflozin group and in 462 of 1,813 patients (25.5%) in the placebo group (hazard ratio HR=0.75, 95% CI 0.65-0.86, p<0.001). Hospitalization for heart failure was reduced (HR=0.69, 95% CI 0.59-0.81). The annual rate of decline in estimated glomerular filtration rate was slower with empagliflozin. Uncomplicated genital tract infections were more frequent in the empagliflozin group (6.4% vs 1.8%).

Conclusion: In this synthetic trial, empagliflozin reduced the combined risk of cardiovascular death or hospitalization for heart failure regardless of the presence of diabetes. The results suggest a potential role for SGLT2 inhibition in this population, although these synthetic findings would require confirmation before informing clinical practice.`,
  },
  {
    id: "diabetes",
    title: "Structured Lifestyle Intervention for Type 2 Diabetes",
    topic: "Diabetes",
    text: `[SYNTHETIC DEMO DATA — not a real study or citation]

Title: Structured Lifestyle Intervention Versus Standard Care for Glycemic Control in Type 2 Diabetes: A Synthetic Randomized Controlled Trial

Background: Intensive lifestyle modification may improve glycemic control in adults with type 2 diabetes, but the durability of benefit and effect on HbA1c in this synthetic evaluation are uncertain.

Methods: We performed a synthetic open-label randomized controlled trial in a primary-care setting. A total of n=540 adults with type 2 diabetes and a baseline HbA1c between 7.5% and 10.0% were randomized 1:1 to a 12-month structured lifestyle intervention (dietary counseling, supervised exercise, and digital coaching) or to standard care. The primary outcome was the change in HbA1c at 12 months. Secondary outcomes included body weight, systolic blood pressure, and medication use.

Results: At 12 months, HbA1c decreased by a mean of 1.1 percentage points in the intervention group versus 0.4 percentage points in the standard-care group, a between-group difference of -0.7 percentage points (95% CI -0.9 to -0.5, p<0.001). Mean body weight fell by 4.8 kg in the intervention group compared with 1.2 kg in the standard-care group. A greater proportion of intervention participants reduced their glucose-lowering medications (28% vs 11%). No serious adverse events were attributed to the intervention.

Conclusion: In this synthetic study, a structured lifestyle intervention produced a modest but statistically significant improvement in HbA1c at 12 months compared with standard care. The findings may indicate potential benefit; however, longer follow-up would be needed to assess whether the improvement in glycemic control is sustained.`,
  },
];
