"""
Medical Knowledge Base Service - RAG with Research Papers
Provides access to curated health research papers and medical literature
"""
import os
from typing import List, Dict, Any, Optional
from django.conf import settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


class MedicalKnowledgeBase:
    """Medical research papers and health literature knowledge base using RAG"""
    
    MEDICAL_RESEARCH_PAPERS = [
        {
            "title": "Common Headache Types and Their Management",
            "content": """
            Headaches are one of the most common health complaints. The three primary types are:
            
            1. TENSION HEADACHES: Most common type, often caused by stress, poor posture, or muscle tension.
            Symptoms include dull, aching head pain, tightness across forehead, tenderness on scalp.
            Management: Rest, hydration, over-the-counter pain relievers (acetaminophen, ibuprofen), 
            stress management, regular exercise, proper sleep hygiene.
            
            2. MIGRAINE HEADACHES: Neurological condition causing severe throbbing pain, usually one-sided.
            Symptoms include pulsating pain, nausea, vomiting, sensitivity to light and sound, visual aura.
            Triggers: Stress, hormonal changes, certain foods, lack of sleep, weather changes.
            Management: Preventive medications, triptans for acute attacks, avoiding triggers, 
            maintaining regular sleep schedule, staying hydrated.
            
            3. CLUSTER HEADACHES: Severe one-sided pain around eye, rare but extremely painful.
            Symptoms include intense burning pain, eye redness and tearing, nasal congestion on affected side.
            Management: Oxygen therapy, sumatriptan injections, preventive medications, avoiding alcohol.
            
            RED FLAGS requiring immediate medical attention:
            - Sudden severe headache (thunderclap)
            - Headache with fever, stiff neck, confusion
            - Headache after head injury
            - Progressive worsening over days/weeks
            - New headache after age 50
            
            Citation: National Institute of Neurological Disorders and Stroke, 2024
            """,
            "category": "neurology",
            "keywords": ["headache", "migraine", "tension", "pain", "cluster headache"]
        },
        {
            "title": "Fever: Causes, Management, and When to Seek Care",
            "content": """
            Fever is elevation of body temperature above 100.4°F (38°C), typically indicating infection.
            
            COMMON CAUSES:
            - Viral infections (flu, common cold, COVID-19)
            - Bacterial infections (strep throat, UTI, pneumonia)
            - Inflammatory conditions (autoimmune diseases)
            - Heat exhaustion
            - Certain medications
            
            FEVER PATTERNS AND SIGNIFICANCE:
            - Low-grade fever (100.4-102°F): Often viral, may self-resolve
            - Moderate fever (102-104°F): Bacterial infection possible, monitor closely
            - High fever (>104°F): Requires immediate medical evaluation
            
            HOME MANAGEMENT:
            - Rest and adequate sleep
            - Hydration (water, electrolyte solutions)
            - Acetaminophen or ibuprofen (follow dosing guidelines)
            - Light clothing, cool compress
            - Monitor temperature every 4 hours
            
            SEEK IMMEDIATE MEDICAL CARE IF:
            - Fever >103°F (39.4°C) in adults
            - Fever lasting >3 days
            - Severe headache or stiff neck
            - Difficulty breathing or chest pain
            - Persistent vomiting or diarrhea
            - Confusion or seizures
            - Rash with fever
            - Infants <3 months with any fever
            
            FEVER IN SPECIAL POPULATIONS:
            - Immunocompromised patients: Any fever requires evaluation
            - Elderly: May have serious infection without high fever
            - Pregnant women: Fever in pregnancy requires medical assessment
            
            Citation: Centers for Disease Control and Prevention (CDC), 2024
            """,
            "category": "infectious-disease",
            "keywords": ["fever", "temperature", "infection", "viral", "bacterial"]
        },
        {
            "title": "Fatigue and Chronic Fatigue Syndrome",
            "content": """
            Fatigue is persistent tiredness not relieved by rest. Affects 20-30% of adults.
            
            TYPES OF FATIGUE:
            1. Physical fatigue: Muscle weakness, reduced physical capacity
            2. Mental fatigue: Difficulty concentrating, memory problems
            3. Chronic fatigue: Lasting >6 months despite rest
            
            COMMON CAUSES:
            - Sleep disorders (insomnia, sleep apnea)
            - Anemia (iron deficiency, B12 deficiency)
            - Thyroid disorders (hypothyroidism)
            - Depression and anxiety
            - Chronic infections (viral, Lyme disease)
            - Diabetes and blood sugar imbalances
            - Heart disease
            - Chronic Fatigue Syndrome (CFS/ME)
            - Medications (sedatives, antihistamines)
            - Poor nutrition and dehydration
            
            CHRONIC FATIGUE SYNDROME (CFS/ME):
            Debilitating disorder with unexplained fatigue lasting >6 months.
            Symptoms:
            - Profound exhaustion not improved by rest
            - Post-exertional malaise (PEM)
            - Unrefreshing sleep
            - Cognitive impairment (brain fog)
            - Orthostatic intolerance
            - Muscle/joint pain without swelling
            
            EVALUATION:
            - Complete blood count (CBC)
            - Thyroid function tests
            - Blood glucose and hemoglobin A1c
            - Vitamin B12 and vitamin D levels
            - Sleep study if sleep apnea suspected
            
            MANAGEMENT STRATEGIES:
            - Prioritize sleep hygiene (7-9 hours nightly)
            - Balanced diet rich in iron, B vitamins, complex carbs
            - Regular moderate exercise (avoid overexertion)
            - Stress management techniques
            - Cognitive behavioral therapy (CBT)
            - Treat underlying conditions
            - Pacing activities (avoid boom-bust cycle)
            
            Citation: Mayo Clinic, National Institute of Health (NIH), 2024
            """,
            "category": "general-medicine",
            "keywords": ["fatigue", "tired", "exhaustion", "chronic fatigue", "energy", "weakness"]
        },
        {
            "title": "Respiratory Infections: Cold, Flu, and COVID-19",
            "content": """
            Respiratory infections are among the most common illnesses affecting upper or lower respiratory tract.
            
            COMMON COLD:
            Caused by rhinoviruses, adenoviruses (>200 viruses).
            Symptoms: Runny nose, sneezing, sore throat, mild cough, low-grade fever (<100.4°F)
            Duration: 7-10 days
            Treatment: Rest, fluids, over-the-counter symptom relief (decongestants, pain relievers)
            
            INFLUENZA (FLU):
            Caused by influenza A and B viruses.
            Symptoms: High fever (>101°F), severe body aches, extreme fatigue, dry cough, headache
            Onset: Sudden (hours to days)
            Duration: 1-2 weeks
            Treatment: Antiviral medications if started within 48 hours (oseltamivir), rest, fluids
            Prevention: Annual flu vaccine
            
            COVID-19:
            Caused by SARS-CoV-2 virus.
            Symptoms: Fever, cough, shortness of breath, loss of taste/smell, fatigue, body aches
            Severity ranges from asymptomatic to severe respiratory distress
            Treatment: Depends on severity - outpatient supportive care, antivirals (Paxlovid), 
            hospitalization for severe cases
            Prevention: Vaccination, masking in high-risk settings, hand hygiene
            
            PNEUMONIA:
            Infection causing lung inflammation, can be bacterial, viral, or fungal.
            Symptoms: High fever, productive cough with colored sputum, chest pain, difficulty breathing
            Risk factors: Age >65, smoking, chronic diseases, weakened immune system
            Treatment: Antibiotics for bacterial pneumonia, antivirals for viral, hospitalization if severe
            
            WARNING SIGNS REQUIRING IMMEDIATE CARE:
            - Difficulty breathing or shortness of breath at rest
            - Persistent chest pain or pressure
            - Bluish lips or face (cyanosis)
            - Confusion or inability to stay awake
            - Severe dehydration
            - Fever >103°F not responding to medication
            
            PREVENTION STRATEGIES:
            - Hand hygiene (frequent washing, hand sanitizer)
            - Avoid close contact with sick individuals
            - Vaccinations (flu, COVID-19, pneumonia)
            - Cover coughs and sneezes
            - Avoid touching face
            - Strengthen immune system (sleep, nutrition, exercise)
            
            Citation: World Health Organization (WHO), CDC, 2024
            """,
            "category": "infectious-disease",
            "keywords": ["cough", "cold", "flu", "covid", "respiratory", "breathing", "pneumonia", "chest"]
        },
        {
            "title": "Gastrointestinal Issues: Nausea, Vomiting, and Diarrhea",
            "content": """
            GI symptoms are common complaints with various causes from benign to serious.
            
            NAUSEA AND VOMITING:
            Common causes:
            - Viral gastroenteritis (stomach flu)
            - Food poisoning
            - Motion sickness
            - Pregnancy (morning sickness)
            - Medications (chemotherapy, antibiotics)
            - Migraines
            - Anxiety and stress
            - Gastroparesis
            - Bowel obstruction (requires emergency care)
            
            Management:
            - Clear fluids (water, electrolyte solutions)
            - BRAT diet (bananas, rice, applesauce, toast)
            - Small frequent meals
            - Ginger tea or ginger supplements
            - Antiemetics (ondansetron, promethazine) if prescribed
            - Avoid strong odors and fatty foods
            
            DIARRHEA:
            Loose, watery stools occurring >3 times daily.
            Acute (<2 weeks): Usually infectious
            Chronic (>4 weeks): May indicate underlying condition
            
            Common causes:
            - Viral infections (norovirus, rotavirus)
            - Bacterial infections (E. coli, Salmonella, C. difficile)
            - Parasites (Giardia)
            - Food intolerances (lactose, gluten)
            - Medications (antibiotics, antacids)
            - Inflammatory bowel disease (Crohn's, ulcerative colitis)
            - Irritable bowel syndrome (IBS)
            
            Management:
            - Hydration (oral rehydration solutions)
            - Bland diet (BRAT)
            - Probiotics
            - Avoid dairy, caffeine, alcohol, fatty foods
            - Loperamide (Imodium) for symptom relief
            - Antibiotics if bacterial cause confirmed
            
            SEEK IMMEDIATE CARE IF:
            - Severe dehydration (dark urine, dizziness, dry mouth)
            - Blood in vomit or stool
            - High fever (>101.5°F)
            - Severe abdominal pain
            - Signs of dehydration in children (no tears, sunken eyes)
            - Symptoms lasting >3 days without improvement
            - Recent travel to developing countries
            - Recent antibiotic use (C. diff risk)
            
            DEHYDRATION WARNING SIGNS:
            - Decreased urination or dark urine
            - Dry mouth and throat
            - Dizziness when standing
            - Rapid heartbeat
            - Confusion
            
            PREVENTION:
            - Hand hygiene before eating and after bathroom
            - Safe food handling and cooking
            - Avoid raw or undercooked foods
            - Drink clean water
            - Food safety during travel
            
            Citation: American Gastroenterological Association, 2024
            """,
            "category": "gastroenterology",
            "keywords": ["nausea", "vomiting", "diarrhea", "stomach", "gastro", "abdominal", "food poisoning"]
        },
        {
            "title": "Cardiovascular Health: Chest Pain and Heart Disease Prevention",
            "content": """
            Cardiovascular disease is the leading cause of death globally. Early recognition and prevention crucial.
            
            CHEST PAIN - TYPES AND CAUSES:
            
            CARDIAC CHEST PAIN (REQUIRES EMERGENCY CARE):
            - Angina: Pressure/squeezing sensation, usually with exertion
            - Heart attack (MI): Severe crushing pain, radiating to arm/jaw, accompanied by sweating, nausea, shortness of breath
            - Characteristics: Central chest, prolonged (>5 min), radiating pain, associated symptoms
            
            NON-CARDIAC CHEST PAIN:
            - Gastroesophageal reflux (GERD): Burning sensation, worse after meals
            - Costochondritis: Sharp pain worsened by movement or breathing
            - Muscle strain: Tender to touch, history of physical activity
            - Anxiety/panic attack: Sharp pain, hyperventilation, palpitations
            - Pulmonary embolism: Sudden onset, sharp, with shortness of breath
            
            CALL 911 IMMEDIATELY IF:
            - Crushing chest pain or pressure
            - Pain radiating to arm, jaw, or back
            - Shortness of breath with chest discomfort
            - Sweating, nausea, lightheadedness with chest pain
            - History of heart disease with new or worsening symptoms
            
            HEART DISEASE RISK FACTORS:
            Modifiable:
            - High blood pressure
            - High cholesterol
            - Smoking
            - Diabetes
            - Obesity
            - Physical inactivity
            - Unhealthy diet
            - Excessive alcohol
            
            Non-modifiable:
            - Age (men >45, women >55)
            - Family history
            - Gender (men higher risk)
            - Race (higher in African Americans)
            
            PREVENTION STRATEGIES:
            1. Diet: Mediterranean diet, reduce saturated fats, increase fruits/vegetables, whole grains
            2. Exercise: 150 minutes moderate activity weekly
            3. Weight management: Maintain healthy BMI (18.5-24.9)
            4. Blood pressure control: Target <120/80 mmHg
            5. Cholesterol management: LDL <100 mg/dL
            6. Diabetes control: HbA1c <7%
            7. Smoking cessation
            8. Stress management
            9. Regular health screenings
            10. Medication adherence if prescribed (statins, antihypertensives)
            
            HEALTHY HEART DIET:
            - Omega-3 fatty acids (fish, walnuts, flaxseed)
            - Fiber (oats, beans, vegetables)
            - Limit sodium (<2,300 mg daily)
            - Limit added sugars
            - Moderate alcohol (if any)
            - Plant sterols and stanols
            
            Citation: American Heart Association (AHA), American College of Cardiology, 2024
            """,
            "category": "cardiology",
            "keywords": ["chest pain", "heart", "cardiac", "cardiovascular", "angina", "heart attack"]
        },
        {
            "title": "Mental Health: Depression, Anxiety, and Stress Management",
            "content": """
            Mental health is as important as physical health. 1 in 5 adults experience mental illness annually.
            
            DEPRESSION (MAJOR DEPRESSIVE DISORDER):
            Persistent sadness or loss of interest lasting >2 weeks.
            
            Symptoms (≥5 needed for diagnosis):
            - Persistent sad, empty, or hopeless mood
            - Loss of interest in previously enjoyed activities
            - Significant weight change or appetite change
            - Sleep disturbances (insomnia or hypersomnia)
            - Psychomotor agitation or retardation
            - Fatigue or energy loss
            - Feelings of worthlessness or excessive guilt
            - Difficulty concentrating or making decisions
            - Recurrent thoughts of death or suicide
            
            Treatment:
            - Psychotherapy (CBT, interpersonal therapy)
            - Antidepressant medications (SSRIs, SNRIs)
            - Exercise (30 minutes daily)
            - Light therapy (for seasonal affective disorder)
            - Social support
            - Sleep hygiene
            
            ANXIETY DISORDERS:
            Excessive worry or fear interfering with daily life.
            
            Types:
            - Generalized anxiety disorder (GAD)
            - Panic disorder
            - Social anxiety disorder
            - Specific phobias
            - Post-traumatic stress disorder (PTSD)
            
            Symptoms:
            - Excessive worry
            - Restlessness or feeling on edge
            - Fatigue
            - Difficulty concentrating
            - Irritability
            - Muscle tension
            - Sleep disturbances
            - Panic attacks (for panic disorder)
            
            Treatment:
            - Cognitive-behavioral therapy (CBT)
            - Exposure therapy
            - Anti-anxiety medications (SSRIs, benzodiazepines)
            - Relaxation techniques
            - Mindfulness and meditation
            - Exercise
            
            STRESS MANAGEMENT TECHNIQUES:
            1. Mindfulness meditation (10-20 minutes daily)
            2. Deep breathing exercises (4-7-8 technique)
            3. Progressive muscle relaxation
            4. Regular physical activity
            5. Adequate sleep (7-9 hours)
            6. Healthy diet
            7. Social connections
            8. Time management
            9. Limit alcohol and caffeine
            10. Hobbies and leisure activities
            
            SUICIDE RISK - SEEK IMMEDIATE HELP IF:
            - Thoughts of harming self or others
            - Suicide plan or intent
            - Feeling hopeless or having no reason to live
            - Recent suicide attempt
            
            National Suicide Prevention Lifeline: 988 (US)
            Crisis Text Line: Text HOME to 741741
            
            WHEN TO SEEK PROFESSIONAL HELP:
            - Symptoms lasting >2 weeks
            - Interfering with work, school, or relationships
            - Substance use as coping mechanism
            - Physical symptoms (headaches, stomach issues)
            - Feeling overwhelmed or unable to cope
            
            Citation: National Institute of Mental Health (NIMH), American Psychiatric Association, 2024
            """,
            "category": "psychiatry",
            "keywords": ["depression", "anxiety", "stress", "mental health", "panic", "worry", "mood", "sad"]
        },
        {
            "title": "Allergies: Types, Symptoms, and Management",
            "content": """
            Allergies occur when immune system overreacts to normally harmless substances (allergens).
            
            COMMON ALLERGY TYPES:
            
            1. SEASONAL ALLERGIES (HAY FEVER/ALLERGIC RHINITIS):
            Triggers: Pollen (trees, grass, weeds), mold spores
            Symptoms: Sneezing, runny nose, itchy eyes, congestion, post-nasal drip
            Peak seasons: Spring (tree pollen), summer (grass), fall (ragweed)
            
            Management:
            - Antihistamines (cetirizine, loratadine, fexofenadine)
            - Nasal corticosteroids (fluticasone)
            - Decongestants (pseudoephedrine)
            - Allergy shots (immunotherapy)
            - Avoid outdoor activities during high pollen counts
            - Keep windows closed
            - Shower after outdoor exposure
            
            2. FOOD ALLERGIES:
            Common allergens: Peanuts, tree nuts, shellfish, fish, eggs, milk, soy, wheat
            Symptoms: Hives, itching, swelling, nausea, vomiting, diarrhea, anaphylaxis
            
            Management:
            - Strict avoidance of allergen
            - Read food labels carefully
            - Carry epinephrine auto-injector (EpiPen)
            - Inform restaurants and food handlers
            - Medical alert bracelet
            
            3. DRUG ALLERGIES:
            Common: Penicillin, sulfa drugs, NSAIDs, chemotherapy
            Symptoms: Rash, hives, fever, anaphylaxis
            
            Management:
            - Inform all healthcare providers
            - Medical alert bracelet
            - Alternative medications
            - Desensitization if drug necessary
            
            4. INSECT STING ALLERGIES:
            Common: Bees, wasps, hornets, fire ants
            Symptoms: Local reaction (pain, swelling) or systemic (anaphylaxis)
            
            Management:
            - Epinephrine auto-injector
            - Avoid wearing bright colors or perfumes outdoors
            - Venom immunotherapy
            
            ANAPHYLAXIS - MEDICAL EMERGENCY:
            Severe, life-threatening allergic reaction.
            
            Symptoms:
            - Difficulty breathing or wheezing
            - Swelling of throat or tongue
            - Rapid pulse
            - Dizziness or fainting
            - Severe drop in blood pressure
            - Skin reactions (hives, flushing)
            - Nausea, vomiting, diarrhea
            
            ACTION:
            1. Administer epinephrine immediately
            2. Call 911
            3. Position person lying down with elevated legs
            4. Second dose of epinephrine if no improvement in 5-15 minutes
            5. Go to emergency room even if symptoms improve
            
            ALLERGY TESTING:
            - Skin prick test
            - Blood test (IgE levels)
            - Oral food challenge (supervised)
            
            PREVENTION:
            - Identify and avoid triggers
            - Use HEPA filters
            - Reduce indoor humidity (<50%)
            - Regular cleaning to remove allergens
            - Consider allergen-proof bedding
            
            Citation: American Academy of Allergy, Asthma & Immunology (AAAAI), 2024
            """,
            "category": "immunology",
            "keywords": ["allergy", "allergic", "hay fever", "pollen", "hives", "rash", "food allergy", "anaphylaxis"]
        },
        {
            "title": "Sleep Disorders: Insomnia and Sleep Hygiene",
            "content": """
            Sleep is essential for health. 50-70 million Americans have sleep disorders.
            
            INSOMNIA:
            Difficulty falling asleep, staying asleep, or poor quality sleep.
            
            Types:
            - Acute insomnia: Lasting days to weeks (stress-related)
            - Chronic insomnia: ≥3 nights/week for ≥3 months
            
            Causes:
            - Stress and anxiety
            - Depression
            - Poor sleep habits
            - Medications
            - Caffeine, alcohol, nicotine
            - Medical conditions (pain, GERD, asthma)
            - Sleep apnea
            - Circadian rhythm disorders
            
            Treatment:
            - Cognitive behavioral therapy for insomnia (CBT-I) - first-line
            - Sleep medications (short-term): zolpidem, eszopiclone, benzodiazepines
            - Melatonin supplements
            - Address underlying conditions
            - Sleep hygiene improvements
            
            SLEEP APNEA:
            Breathing repeatedly stops and starts during sleep.
            
            Symptoms:
            - Loud snoring
            - Gasping for air during sleep
            - Morning headaches
            - Excessive daytime sleepiness
            - Difficulty concentrating
            - Irritability
            
            Risk factors: Obesity, neck circumference, male gender, age, family history
            
            Treatment:
            - CPAP (continuous positive airway pressure) - gold standard
            - Weight loss
            - Positional therapy (avoid sleeping on back)
            - Oral appliances
            - Surgery (in severe cases)
            
            OPTIMAL SLEEP HYGIENE:
            
            1. CONSISTENT SCHEDULE:
            - Go to bed and wake up same time daily (including weekends)
            - Aim for 7-9 hours of sleep
            
            2. BEDROOM ENVIRONMENT:
            - Cool temperature (60-67°F)
            - Dark (use blackout curtains or eye mask)
            - Quiet (use earplugs or white noise if needed)
            - Comfortable mattress and pillows
            - Reserve bed for sleep and intimacy only
            
            3. PRE-SLEEP ROUTINE:
            - Wind down 30-60 minutes before bed
            - Dim lights (reduce blue light exposure)
            - Relaxation techniques (reading, meditation, gentle stretching)
            - Warm bath or shower
            
            4. DAYTIME HABITS:
            - Regular exercise (but not within 3 hours of bedtime)
            - Sunlight exposure in morning
            - Limit daytime naps to 20-30 minutes
            - Avoid caffeine after 2 PM
            - Limit alcohol (disrupts sleep quality)
            - Avoid large meals close to bedtime
            
            5. TECHNOLOGY:
            - No screens 1 hour before bed
            - Use blue light filters if must use devices
            - Keep phone out of bedroom or in airplane mode
            - Consider apps for white noise or meditation
            
            6. STRESS MANAGEMENT:
            - Write down worries before bed
            - Practice relaxation techniques
            - If unable to sleep after 20 minutes, get up and do quiet activity
            
            WHEN TO SEE A DOCTOR:
            - Insomnia lasting >3 weeks
            - Excessive daytime sleepiness
            - Snoring with breathing pauses
            - Unusual movements or behaviors during sleep
            - Difficulty staying awake during day
            
            Citation: American Academy of Sleep Medicine, National Sleep Foundation, 2024
            """,
            "category": "sleep-medicine",
            "keywords": ["sleep", "insomnia", "tired", "fatigue", "sleep apnea", "snoring", "drowsy"]
        },
        {
            "title": "Diabetes: Prevention, Management, and Complications",
            "content": """
            Diabetes mellitus is a metabolic disorder affecting how body uses blood sugar (glucose).
            
            TYPES OF DIABETES:
            
            1. TYPE 1 DIABETES:
            - Autoimmune destruction of insulin-producing cells
            - Usually diagnosed in children/young adults
            - Requires insulin therapy
            - Symptoms: Increased thirst, frequent urination, extreme hunger, weight loss, fatigue, blurred vision
            
            2. TYPE 2 DIABETES:
            - Insulin resistance and relative insulin deficiency
            - 90-95% of diabetes cases
            - Associated with obesity, physical inactivity, age
            - May be managed with lifestyle changes and oral medications
            
            3. PREDIABETES:
            - Blood sugar higher than normal but not yet diabetes
            - High risk of developing type 2 diabetes
            - Fasting glucose 100-125 mg/dL or HbA1c 5.7-6.4%
            
            4. GESTATIONAL DIABETES:
            - Develops during pregnancy
            - Usually resolves after delivery
            - Increases risk of type 2 diabetes later
            
            SYMPTOMS OF DIABETES:
            - Increased thirst and urination
            - Increased hunger
            - Unexplained weight loss
            - Fatigue
            - Blurred vision
            - Slow-healing sores
            - Frequent infections
            - Tingling or numbness in hands/feet
            
            DIAGNOSIS:
            - Fasting blood glucose ≥126 mg/dL (on two occasions)
            - Random blood glucose ≥200 mg/dL with symptoms
            - HbA1c ≥6.5%
            - Oral glucose tolerance test ≥200 mg/dL at 2 hours
            
            MANAGEMENT OF TYPE 2 DIABETES:
            
            1. LIFESTYLE MODIFICATIONS:
            - Weight loss (5-10% of body weight can significantly improve control)
            - Exercise: 150 minutes moderate activity weekly
            - Healthy diet: Low glycemic index foods, portion control
            - Smoking cessation
            - Limit alcohol
            
            2. MEDICATIONS:
            - Metformin (first-line)
            - Sulfonylureas
            - DPP-4 inhibitors
            - GLP-1 receptor agonists
            - SGLT2 inhibitors
            - Insulin (if needed)
            
            3. MONITORING:
            - Self-monitoring of blood glucose
            - HbA1c every 3 months (target <7% for most)
            - Annual dilated eye exam
            - Foot exams
            - Kidney function tests
            - Lipid profile
            
            DIET RECOMMENDATIONS:
            - Carbohydrate counting or plate method
            - High fiber foods (vegetables, whole grains, legumes)
            - Lean proteins
            - Healthy fats (olive oil, nuts, avocado)
            - Limit sugary drinks and processed foods
            - Consistent meal timing
            
            COMPLICATIONS (IF UNCONTROLLED):
            - Cardiovascular disease
            - Neuropathy (nerve damage)
            - Nephropathy (kidney disease)
            - Retinopathy (eye damage, blindness)
            - Foot problems (ulcers, amputation)
            - Skin conditions
            - Hearing impairment
            - Dementia
            
            PREVENTION OF TYPE 2 DIABETES:
            - Maintain healthy weight
            - Regular physical activity
            - Healthy diet
            - Avoid smoking
            - Regular health screenings
            
            HYPOGLYCEMIA (LOW BLOOD SUGAR) WARNING:
            Symptoms: Shakiness, sweating, confusion, rapid heartbeat, dizziness
            Treatment: 15-15 rule - 15g fast-acting carbs, recheck in 15 minutes
            Examples: 4 glucose tablets, 1/2 cup juice, 1 tablespoon honey
            
            Citation: American Diabetes Association (ADA), 2024
            """,
            "category": "endocrinology",
            "keywords": ["diabetes", "blood sugar", "glucose", "insulin", "prediabetes", "thirst", "urination"]
        }
    ]
    
    def __init__(self):
        """Initialize medical knowledge base"""
        self.persist_directory = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'chroma_db_medical'
        )
        
        # Use HuggingFace embeddings (free, local, no API key needed)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        
        self.vectorstore = None
        self._initialize_knowledge_base()
    
    def _initialize_knowledge_base(self):
        """Initialize knowledge base with research papers"""
        try:
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings,
                collection_name="medical_knowledge"
            )
            
            collection_count = self.vectorstore._collection.count()
            if collection_count == 0:
                self._populate_knowledge_base()
        except Exception as e:
            print(f"Creating new medical knowledge base: {e}")
            self._populate_knowledge_base()
    
    def _populate_knowledge_base(self):
        """Populate knowledge base with research papers"""
        print("Populating medical knowledge base with research papers...")
        
        # Text splitter for chunking large documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        documents = []
        for paper in self.MEDICAL_RESEARCH_PAPERS:
            chunks = text_splitter.split_text(paper['content'])
            
            for i, chunk in enumerate(chunks):
                doc = Document(
                    page_content=chunk,
                    metadata={
                        'title': paper['title'],
                        'category': paper['category'],
                        'keywords': ','.join(paper['keywords']),
                        'chunk': i,
                        'source': 'medical_research_database'
                    }
                )
                documents.append(doc)
        
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name="medical_knowledge"
        )
        
        print(f"Medical knowledge base initialized with {len(documents)} document chunks")
    
    def search_medical_knowledge(
        self,
        query: str,
        k: int = 3,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search medical research papers for relevant information
        
        Args:
            query: Search query
            k: Number of results to return
            category: Optional category filter
        
        Returns:
            List of relevant document chunks with metadata
        """
        if not query or not query.strip():
            return []
        
        try:
            where_filter = None
            if category:
                where_filter = {"category": category}
            
            results = self.vectorstore.similarity_search_with_relevance_scores(
                query=query,
                k=k,
                filter=where_filter
            )
            
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "relevance_score": float(score)
                })
            
            return formatted_results
        except Exception as e:
            print(f"Error searching medical knowledge: {e}")
            return []
    
    def get_research_context(
        self,
        query: str,
        max_results: int = 2
    ) -> str:
        """
        Get formatted research paper context for a query
        
        Args:
            query: User's health query
            max_results: Maximum number of research papers to include
        
        Returns:
            Formatted research context string with citations
        """
        results = self.search_medical_knowledge(query, k=max_results)
        
        if not results:
            return ""
        
        context_parts = ["Relevant Medical Research:\n"]
        
        for idx, result in enumerate(results, 1):
            title = result['metadata'].get('title', 'Medical Research')
            content = result['content']
            relevance = result['relevance_score']
            
            context_parts.append(f"\n{idx}. {title} (Relevance: {relevance:.2f})")
            context_parts.append(f"{content}\n")
        
        return "\n".join(context_parts)
    
    def get_available_categories(self) -> List[str]:
        """Get list of available medical categories"""
        return list(set(paper['category'] for paper in self.MEDICAL_RESEARCH_PAPERS))


_medical_kb_instance = None


def get_medical_knowledge_base() -> MedicalKnowledgeBase:
    """Get or create medical knowledge base singleton"""
    global _medical_kb_instance
    if _medical_kb_instance is None:
        _medical_kb_instance = MedicalKnowledgeBase()
    return _medical_kb_instance
