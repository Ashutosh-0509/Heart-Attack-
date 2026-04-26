import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';
// @ts-ignore - chart.js imported correctly depending on the project
import Chart from 'chart.js/auto';
import './cvd-predictor.css';

const MODEL = {
  coef:      [0.339085, 0.135304, 0.012165, 0.33993, -0.070266, -0.05742, -0.092789, 0.930461, 0.107033],
  intercept: 0.028908,
  means:     [53.2937, 27.4879, 0.3503, 1.3646, 1.2256, 0.0874, 0.8031, 126.6524, 81.2971],
  stds:      [6.7452, 5.3745, 0.4771, 0.6788, 0.5722, 0.2825, 0.3977, 16.6986, 9.4317],
  features:  ['age_years','bmi','gender','cholesterol','glucose','smoking','active','systolic','diastolic'],
  labels:    ['Age','BMI','Gender','Cholesterol','Glucose','Smoking','Activity','Systolic BP','Diastolic BP'],
};

const FI = {
  'Systolic BP': 44.6,
  'Cholesterol': 16.3,
  'Age':         16.3,
  'BMI':          6.5,
  'Diastolic BP': 5.1,
  'Activity':     4.5,
  'Glucose':      3.4,
  'Smoking':      2.8,
  'Gender':       0.6,
};

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

export default function CvdPredictor() {
  const [age, setAge] = useState(45);
  const [gender, setGender] = useState(0); // 0=female, 1=male
  const [height, setHeight] = useState(168);
  const [weight, setWeight] = useState(70);
  const [sys, setSys] = useState(120);
  const [dia, setDia] = useState(80);
  const [chol, setChol] = useState(1);
  const [gluc, setGluc] = useState(1);
  const [smoke, setSmoke] = useState(0);
  const [active, setActive] = useState(1);

  const [hasPredicted, setHasPredicted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const fiChartRef = useRef<HTMLCanvasElement>(null);
  const gaugeChartRef = useRef<HTMLCanvasElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const bmi = weight / ((height/100)**2);

  const handlePredict = () => {
    const raw = [age, bmi, gender, chol, gluc, smoke, active, sys, dia];
    const z = raw.map((v, i) => (v - MODEL.means[i]) / MODEL.stds[i]);
    const logit = z.reduce((s, v, i) => s + v * MODEL.coef[i], MODEL.intercept);
    const prob = sigmoid(logit);
    
    const contribs = raw.map((v, i) => ({ 
      label: MODEL.labels[i], 
      contribution: z[i] * MODEL.coef[i] 
    }));

    setResult({ prob, contribs, vals: { age, bmi, chol, gluc, smoke, active, sys, dia } });
    setHasPredicted(true);

    setTimeout(() => {
      if (resultsContainerRef.current) {
        resultsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  useEffect(() => {
    if (!hasPredicted || !result) return;
    
    // Draw Gauge
    if (gaugeChartRef.current) {
      const ctx = gaugeChartRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0,0,200,110);
        const { prob } = result;
        const color = prob < 0.35 ? '#1D9E75' : prob < 0.6 ? '#EF9F27' : '#E24B4A';
        const cx=100, cy=100, r=80, lw=13;
        
        ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,2*Math.PI);
        ctx.strokeStyle='#E8E6E0'; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.stroke();
        
        ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI,Math.PI+prob*Math.PI);
        ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.stroke();
        
        [.35,.6].forEach(v => {
          const a = Math.PI+v*Math.PI;
          ctx.beginPath(); ctx.moveTo(cx+(r-9)*Math.cos(a),cy+(r-9)*Math.sin(a));
          ctx.lineTo(cx+(r+1)*Math.cos(a),cy+(r+1)*Math.sin(a));
          ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
        });
      }
    }

    // Draw FI Chart
    if (fiChartRef.current) {
      const entries = Object.entries(FI).sort((a,b)=>b[1]-a[1]);
      const labels  = entries.map(e=>e[0]);
      const data    = entries.map(e=>e[1]);
      const colors  = data.map(v => v>20?'#E24B4A':v>10?'#EF9F27':'#85B7EB');
      
      const existingChart = Chart.getChart(fiChartRef.current);
      if (existingChart) existingChart.destroy();
      
      new Chart(fiChartRef.current, {
        type:'bar',
        data:{labels,datasets:[{data,backgroundColor:colors,borderRadius:5,borderSkipped:false}]},
        options:{
          indexAxis:'y',responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:false},tooltip:{callbacks:{label:(c:any)=>` ${c.raw}% weight`}}},
          scales:{x:{ticks:{callback:(v:any)=>v+'%'},grid:{color:'rgba(0,0,0,.04)'}},y:{grid:{display:false}}}
        }
      });
    }
  }, [hasPredicted, result]);

  const renderAdvice = () => {
    if (!result) return null;
    const { vals } = result;
    const advice = [];

    if (vals.sys >= 140)
      advice.push({t:'danger', title:'High BP', text:'Systolic >=140 mmHg — Stage 2 hypertension. Dataset avg is 126.7 mmHg.'});
    else if (vals.sys >= 130)
      advice.push({t:'warning', title:'Elevated BP', text:'Systolic 130–139 mmHg — Stage 1 hypertension. Consider lifestyle modification.'});
    else
      advice.push({t:'good', title:'Normal BP', text:'Systolic < 130 mmHg — blood pressure within healthy range.'});

    if (vals.chol===3)
      advice.push({t:'danger', title:'High Cholesterol', text:'Level 3 cholesterol — 76.3% HIGH-risk rate in our dataset. Urgent review.'});
    else if (vals.chol===2)
      advice.push({t:'warning', title:'Borderline Cholesterol', text:'Level 2 cholesterol — 59.6% HIGH-risk rate. Diet and exercise help.'});
    else
      advice.push({t:'good', title:'Normal Cholesterol', text:'Cholesterol within normal range — continue healthy diet habits.'});

    if (vals.gluc===3)
      advice.push({t:'danger', title:'Diabetic Range', text:'Diabetic blood sugar level raises CVD risk score significantly.'});
    else if (vals.gluc===2)
      advice.push({t:'warning', title:'Pre-diabetic', text:'Pre-diabetic blood sugar — monitor glucose and reduce refined carbs.'});

    if (vals.active === 0)
      advice.push({t:'warning', title:'Inactive', text:'Inactive patients show a 53.3% HIGH-risk rate vs 48.5% in active patients (4.8% diff).'});
    else
      advice.push({t:'good', title:'Physically Active', text:'Active patients show 48.5% HIGH-risk rate — 4.8% lower than inactive peers.'});

    if (vals.smoke === 1)
      advice.push({t:'danger', title:'Active Smoker', text:'Smoking increases CVD risk. Dataset evidence shows higher risk for smokers.'});
    else
      advice.push({t:'good', title:'Non-smoker', text:'Non-smoking significantly reduces cardiovascular risk burden.'});

    if (vals.bmi >= 30)
      advice.push({t:'warning', title:`BMI ${vals.bmi.toFixed(1)} — Obese`, text:'Average BMI for HIGH-risk patients in our dataset is 28.48. Weight reduction recommended.'});
    else if (vals.bmi < 18.5)
      advice.push({t:'info', title:`BMI ${vals.bmi.toFixed(1)} — Underweight`, text:'Consider nutritional assessment and healthy weight gain strategies.'});
    else
      advice.push({t:'good', title:`BMI ${vals.bmi.toFixed(1)} — Healthy`, text:'BMI within healthy range (18.5–25). Dataset high-risk avg is 28.48.'});

    return advice.slice(0,6).map((a, i) => (
      <div key={i} className={`cvd-advice-card ${a.t}`}><strong>{a.title}</strong>{a.text}</div>
    ));
  };

  const renderFactorBars = () => {
    if (!result) return null;
    const sorted = [...result.contribs].sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution)).slice(0,6);
    const maxC = Math.max(...sorted.map((f:any)=>Math.abs(f.contribution)));
    
    return sorted.map((f:any, i:number) => {
      const isRisk = f.contribution > 0;
      const bc = isRisk ? '#E24B4A' : '#1D9E75';
      const w  = maxC>0 ? Math.round(Math.abs(f.contribution)/maxC*100) : 0;
      return (
        <div key={i} className="cvd-factor-row">
          <div className="cvd-factor-header">
            <span className="cvd-factor-name">{f.label}</span>
            <span style={{fontWeight:500,color:bc}}>{isRisk?'+ Risk':'− Risk'}</span>
          </div>
          <div className="cvd-factor-track"><div className="cvd-factor-fill" style={{width:`${w}%`,background:bc}}></div></div>
        </div>
      );
    });
  };

  const pctString = result ? Math.round(result.prob * 100) + '%' : '—';
  const color = result ? (result.prob < 0.35 ? '#1D9E75' : result.prob < 0.6 ? '#EF9F27' : '#E24B4A') : '#888';
  const levelText = result ? (result.prob < 0.35 ? 'Low Risk' : result.prob < 0.6 ? 'Moderate Risk' : 'High Risk') : '—';
  const levelClass = result ? (result.prob < 0.35 ? 'low' : result.prob < 0.6 ? 'moderate' : 'high') : '';

  return (
    <div className="cvd-wrapper h-full">
      {/* NAV */}
      <nav className="cvd-nav">
        <div className="cvd-nav-left">
          <Link to={ROUTE_PATHS.SCAN_SELECT} className="mr-2 text-[#888] hover:text-[#333] transition-colors"><ChevronLeft size={24} /></Link>
          <div className="cvd-nav-icon">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.514 3.393 1 6.9 1c2.04 0 3.718 1.24 5.1 3.02C13.382 2.24 15.062 1 17.1 1 20.607 1 23 3.514 23 7.191c0 4.105-5.371 8.863-11 14.402z" fill="white"/></svg>
          </div>
          <div>
            <div className="cvd-nav-brand">CardioPredict</div>
            <div className="cvd-nav-sub">AI-powered CVD risk assessment</div>
          </div>
        </div>
        <div className="cvd-nav-badge">Trained on 68,629 patients · 73.0% accuracy · AUC 0.795</div>
      </nav>

      {/* DATASET STATS STRIP */}
      <div className="cvd-ds-strip">
        <div className="cvd-ds-cell"><div className="cvd-ds-num">68,629</div><div className="cvd-ds-lbl">Total Records</div></div>
        <div className="cvd-ds-cell"><div className="cvd-ds-num">49.5%</div><div className="cvd-ds-lbl">High-risk Patients</div></div>
        <div className="cvd-ds-cell"><div className="cvd-ds-num">126.7</div><div className="cvd-ds-lbl">Avg Systolic BP (mmHg)</div></div>
        <div className="cvd-ds-cell"><div className="cvd-ds-num">28.48</div><div className="cvd-ds-lbl">Avg BMI (High-risk)</div></div>
      </div>

      <div className="cvd-layout">
        {/* FORM PANEL */}
        <div className="cvd-form-panel">
          <div className="cvd-form-header">
            <h2>Enter Patient Details</h2>
            <p>Adjust values and click Predict to assess cardiovascular risk</p>
          </div>

          {/* Demographics */}
          <div className="cvd-form-section">
            <div className="cvd-section-title">Demographics</div>
            <div className="cvd-field">
              <div className="cvd-slider-val"><label>Age</label><span className="cvd-val-num">{age}</span><span className="cvd-val-unit"> years</span></div>
              <input type="range" min="20" max="80" value={age} onChange={(e)=>setAge(+e.target.value)} />
            </div>
            <div className="cvd-field">
              <label>Gender</label>
              <div className="cvd-toggle-group">
                <button className={`cvd-toggle-btn ${gender===0?'active teal':''}`} onClick={()=>setGender(0)}>Female</button>
                <button className={`cvd-toggle-btn ${gender===1?'active red':''}`} onClick={()=>setGender(1)}>Male</button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="cvd-form-section">
            <div className="cvd-section-title">Body Measurements</div>
            <div className="cvd-field-row">
              <div className="cvd-field">
                <label>Height (cm)</label>
                <input type="number" value={height} min="130" max="220" onChange={(e)=>setHeight(+e.target.value)} />
              </div>
              <div className="cvd-field">
                <label>Weight (kg)</label>
                <input type="number" value={weight} min="30" max="200" onChange={(e)=>setWeight(+e.target.value)} />
              </div>
            </div>
            <div className="cvd-field">
              <div className="cvd-slider-val">
                <label>BMI <span style={{fontSize:'11px',color:'var(--faint)'}}>(auto-calculated)</span></label>
                <span className="cvd-val-num">{bmi.toFixed(1)}</span>
              </div>
              <div style={{height:10,borderRadius:5,background:'linear-gradient(to right, var(--blue) 0%, var(--blue) 21.25%, var(--teal) 21.25%, var(--teal) 37.5%, var(--amber) 37.5%, var(--amber) 50%, var(--red) 50%)',position:'relative',marginTop:16,boxShadow:'inset 0 1px 3px rgba(0,0,0,0.1)'}}>
              <div style={{
                position:'absolute',
                height:22,width:4,background:'#1a1a18',
                top:-6,borderRadius:2,border:'2px solid #fff',
                boxShadow:'0 2px 4px rgba(0,0,0,0.2)',
                left:`${Math.min(100,Math.max(0,(bmi-10)/40*100))}%`,
                transition:'.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}></div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'var(--faint)',marginTop:12,fontWeight:600,textTransform:'uppercase',letterSpacing:'.02em'}}>
              <span style={{color:bmi<18.5?'var(--blue)':'',opacity:bmi<18.5?1:0.6}}>Underweight</span>
              <span style={{color:bmi>=18.5&&bmi<25?'var(--teal)':'',opacity:bmi>=18.5&&bmi<25?1:0.6}}>Normal</span>
              <span style={{color:bmi>=25&&bmi<30?'var(--amber)':'',opacity:bmi>=25&&bmi<30?1:0.6}}>Overweight</span>
              <span style={{color:bmi>=30?'var(--red)':'',opacity:bmi>=30?1:0.6}}>Obese</span>
            </div>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="cvd-form-section">
            <div className="cvd-section-title">Blood Pressure</div>
            <div className="cvd-field">
              <div className="cvd-slider-val"><label>Systolic (ap_hi)</label><span className="cvd-val-num">{sys}</span><span className="cvd-val-unit"> mmHg</span></div>
              <input type="range" min="80" max="220" value={sys} onChange={(e)=>setSys(+e.target.value)} />
            </div>
            <div className="cvd-field">
              <div className="cvd-slider-val"><label>Diastolic (ap_lo)</label><span className="cvd-val-num">{dia}</span><span className="cvd-val-unit"> mmHg</span></div>
              <input type="range" min="40" max="140" value={dia} onChange={(e)=>setDia(+e.target.value)} />
            </div>
          </div>

          {/* Lab Values */}
          <div className="cvd-form-section">
            <div className="cvd-section-title">Lab Values</div>
            <div className="cvd-field">
              <label>Cholesterol Level</label>
              <select value={chol} onChange={(e)=>setChol(+e.target.value)}>
                <option value={1}>Normal (≤200 mg/dL)</option>
                <option value={2}>Above Normal (200–240 mg/dL)</option>
                <option value={3}>Well Above Normal (&gt;240 mg/dL)</option>
              </select>
            </div>
            <div className="cvd-field">
              <label>Glucose / Blood Sugar</label>
              <select value={gluc} onChange={(e)=>setGluc(+e.target.value)}>
                <option value={1}>Normal (≤100 mg/dL)</option>
                <option value={2}>Pre-diabetic (100–126 mg/dL)</option>
                <option value={3}>Diabetic range (&gt;126 mg/dL)</option>
              </select>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="cvd-form-section">
            <div className="cvd-section-title">Lifestyle</div>
            <div className="cvd-field">
              <label>Smoking</label>
              <div className="cvd-toggle-group">
                <button className={`cvd-toggle-btn ${smoke===0?'active teal':''}`} onClick={()=>setSmoke(0)}>Non-smoker</button>
                <button className={`cvd-toggle-btn ${smoke===1?'active red':''}`} onClick={()=>setSmoke(1)}>Smoker</button>
              </div>
            </div>
            <div className="cvd-field" style={{marginTop:'.75rem'}}>
              <label>Physical Activity</label>
              <div className="cvd-toggle-group">
                <button className={`cvd-toggle-btn ${active===0?'active red':''}`} onClick={()=>setActive(0)}>Inactive</button>
                <button className={`cvd-toggle-btn ${active===1?'active teal':''}`} onClick={()=>setActive(1)}>Active</button>
              </div>
            </div>
          </div>

          <button className="cvd-predict-btn" onClick={handlePredict}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Predict CVD Risk
          </button>
          <div className="cvd-disclaimer"><strong>Disclaimer:</strong> For educational purposes only. Not a substitute for clinical diagnosis. Always consult a qualified healthcare professional.</div>
        </div>

        {/* RESULTS PANEL */}
        <div className="cvd-results-panel" ref={resultsContainerRef}>
          {!hasPredicted ? (
            <div className="cvd-placeholder">
              <div className="cvd-placeholder-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.514 3.393 1 6.9 1c2.04 0 3.718 1.24 5.1 3.02C13.382 2.24 15.062 1 17.1 1 20.607 1 23 3.514 23 7.191c0 4.105-5.371 8.863-11 14.402z"/></svg>
              </div>
              <h3>No prediction yet</h3>
              <p>Fill in the patient details and click "Predict CVD Risk" to see results.</p>
            </div>
          ) : (
            <div>
              {/* Model stats bar */}
              <div className="cvd-stats-bar">
                <div className="cvd-stat-cell"><div className="cvd-stat-num">73.0%</div><div className="cvd-stat-lbl">Model Accuracy</div></div>
                <div className="cvd-stat-cell"><div className="cvd-stat-num">0.795</div><div className="cvd-stat-lbl">AUC-ROC Score</div></div>
                <div className="cvd-stat-cell"><div className="cvd-stat-num">68,629</div><div className="cvd-stat-lbl">Training Records</div></div>
              </div>

              {/* Prediction gauge card */}
              <div className="cvd-result-card">
                <div className="cvd-card-title">Prediction Result</div>
                <div className="cvd-gauge-wrap">
                  <canvas ref={gaugeChartRef} width="200" height="110"></canvas>
                  <div className="cvd-gauge-pct" style={{color:color}}>{pctString}</div>
                </div>
                <div className="cvd-gauge-lbl">CVD probability score</div>
                <div className={`cvd-risk-level ${levelClass}`}>{levelText}</div>
                <div className="cvd-risk-pct-text">{pctString} estimated probability of cardiovascular disease</div>
                <div>
                  <div className="cvd-risk-bar-wrap"><div className="cvd-risk-bar-fill" style={{width:pctString,background:color}}></div></div>
                  <div className="cvd-risk-markers"><span>Low risk</span><span>Moderate</span><span>High risk</span></div>
                </div>
              </div>

              {/* Key Contributing Factors */}
              <div className="cvd-result-card">
                <div className="cvd-card-title">Key Contributing Factors</div>
                <div>{renderFactorBars()}</div>
              </div>

              {/* Clinical observations */}
              <div className="cvd-result-card">
                <div className="cvd-card-title">Clinical Observations</div>
                <div className="cvd-advice-grid">{renderAdvice()}</div>
              </div>

              {/* Feature importance */}
              <div className="cvd-result-card">
                <div className="cvd-card-title">
                  Model — Feature Importances (Trained LR)
                  <span className="cvd-trained-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Trained on 68,629 patients · 73.0% acc · AUC 0.795
                  </span>
                </div>
                <div style={{position:'relative',height:220}}><canvas ref={fiChartRef}></canvas></div>
              </div>

              {/* Data Sources */}
              <div className="cvd-sources-card">
                <h4>Training Data Sources</h4>
                <div className="cvd-source-row">
                  <span className="cvd-source-name">cardio_train.csv</span>
                  <span className="cvd-source-meta">68,629 patients · Real-world clinical dataset</span>
                </div>
                <div className="cvd-source-row">
                  <span className="cvd-source-name">Features Used</span>
                  <span className="cvd-source-meta">Age, BMI, Gender, Cholesterol, Glucose, Smoking, Activity, BP</span>
                </div>
                <div className="cvd-source-row">
                  <span className="cvd-source-name">Algorithm</span>
                  <span className="cvd-source-meta">Logistic Regression · StandardScaler · 80/20 train-test split</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
