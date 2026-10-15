// 4 preset EDM HTML templates for Singapore industrial real estate outreach.
// Replace placeholder values ([Your Name], [Your Brokerage Name], phone numbers) before sending.

export type EdmTemplate = {
  id: number
  name: string
  desc: string
  accentColor: string
  bgColor: string
  html: () => string
}

export const EDM_TEMPLATES: EdmTemplate[] = [
  {
    id: 1,
    name: "Why Choose Us",
    desc: "Benefits-led intro · Best for cold outreach & first impressions",
    accentColor: "#2563EB",
    bgColor: "#EFF6FF",
    html: () => `<table width="600" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
<tr><td style="background:linear-gradient(135deg,#1D4ED8 0%,#0891B2 100%);padding:44px 40px 36px;text-align:center;">
  <div style="display:inline-block;background:rgba(255,255,255,.15);border-radius:8px;padding:8px 20px;margin-bottom:18px;">
    <span style="color:white;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">Singapore Industrial &amp; Logistics Specialists</span>
  </div>
  <h1 style="color:#ffffff;font-size:36px;font-weight:900;margin:0 0 12px;line-height:1.15;">Why 500+ Companies<br>Choose Us</h1>
  <p style="color:rgba(255,255,255,.9);font-size:16px;margin:0;line-height:1.6;">Access Singapore's largest off-market industrial database — and a team that closes deals others can't.</p>
</td></tr>
<tr><td style="background:#0F172A;padding:20px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="text-align:center;border-right:1px solid rgba(255,255,255,.1);padding:0 16px;">
      <div style="color:#F59E0B;font-size:28px;font-weight:900;line-height:1;">20+</div>
      <div style="color:rgba(255,255,255,.6);font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Years Experience</div>
    </td>
    <td style="text-align:center;border-right:1px solid rgba(255,255,255,.1);padding:0 16px;">
      <div style="color:#F59E0B;font-size:28px;font-weight:900;line-height:1;">10K+</div>
      <div style="color:rgba(255,255,255,.6);font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Property Listings</div>
    </td>
    <td style="text-align:center;border-right:1px solid rgba(255,255,255,.1);padding:0 16px;">
      <div style="color:#F59E0B;font-size:28px;font-weight:900;line-height:1;">500+</div>
      <div style="color:rgba(255,255,255,.6);font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Corporate Clients</div>
    </td>
    <td style="text-align:center;padding:0 16px;">
      <div style="color:#F59E0B;font-size:28px;font-weight:900;line-height:1;">50M+</div>
      <div style="color:rgba(255,255,255,.6);font-size:10px;text-transform:uppercase;letter-spacing:.1em;margin-top:4px;">Sq Ft Transacted</div>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:36px 40px 24px;background:#F8FAFC;">
  <p style="color:#1E293B;font-size:16px;font-weight:700;margin:0 0 8px;">Hi [First Name],</p>
  <p style="color:#475569;font-size:14px;line-height:1.7;margin:0;">Whether you're expanding, relocating, or optimising your logistics footprint in Singapore, our team gives you an unfair advantage — from off-market access to deal structuring.</p>
</td></tr>
<tr><td style="padding:0 32px 32px;background:#F8FAFC;">
  <table width="100%" cellpadding="0" cellspacing="8"><tr>
    <td width="50%" valign="top" style="padding:4px;">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border-left:4px solid #2563EB;box-shadow:0 2px 12px rgba(37,99,235,.08);">
        <div style="font-size:28px;margin-bottom:12px;">🏭</div>
        <div style="color:#2563EB;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Largest Database</div>
        <p style="color:#475569;font-size:13px;line-height:1.65;margin:0;">10,000+ industrial, logistics &amp; 3PL spaces across Singapore. More options. Better match. Faster deal.</p>
      </div>
    </td>
    <td width="50%" valign="top" style="padding:4px;">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border-left:4px solid #0891B2;box-shadow:0 2px 12px rgba(8,145,178,.08);">
        <div style="font-size:28px;margin-bottom:12px;">🎯</div>
        <div style="color:#0891B2;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Tailored Solutions</div>
        <p style="color:#475569;font-size:13px;line-height:1.65;margin:0;">Every brief is different. We match spec requirements — ceiling height, power load, dock doors — not just square footage.</p>
      </div>
    </td>
  </tr><tr>
    <td width="50%" valign="top" style="padding:4px;">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border-left:4px solid #F59E0B;box-shadow:0 2px 12px rgba(245,158,11,.08);">
        <div style="font-size:28px;margin-bottom:12px;">📊</div>
        <div style="color:#D97706;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Market Intelligence</div>
        <p style="color:#475569;font-size:13px;line-height:1.65;margin:0;">Real-time price benchmarks, vacancy trends, and upcoming supply — we help you transact at the right time and price.</p>
      </div>
    </td>
    <td width="50%" valign="top" style="padding:4px;">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border-left:4px solid #16A34A;box-shadow:0 2px 12px rgba(22,163,74,.08);">
        <div style="font-size:28px;margin-bottom:12px;">⚡</div>
        <div style="color:#16A34A;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Save Time</div>
        <p style="color:#475569;font-size:13px;line-height:1.65;margin:0;">We handle shortlisting, viewings, negotiation and due diligence — you focus on running your business.</p>
      </div>
    </td>
  </tr></table>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 40px;text-align:center;border-top:1px solid #E2E8F0;">
  <h2 style="color:#0F172A;font-size:22px;font-weight:800;margin:0 0 8px;">Ready to Find Your Ideal Space?</h2>
  <p style="color:#64748B;font-size:14px;margin:0 0 24px;line-height:1.6;">No commitment. Just a 15-minute call to understand your requirements.</p>
  <a href="https://wa.me/6591234567" style="display:inline-block;background:#25D366;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;margin:0 6px 8px;box-shadow:0 4px 12px rgba(37,211,102,.35);">💬 WhatsApp Us</a>
  <a href="tel:+6591234567" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;margin:0 6px 8px;box-shadow:0 4px 12px rgba(37,99,235,.3);">📞 Call Now</a>
</td></tr>
<tr><td style="background:#0F172A;padding:24px 40px;text-align:center;">
  <p style="color:rgba(255,255,255,.5);font-size:11px;margin:0;line-height:1.7;">© 2024 [Your Brokerage Name] · Singapore<br>To unsubscribe, reply with "remove" to this email.</p>
</td></tr>
</table>`,
  },
  {
    id: 2,
    name: "Availability Bulletin",
    desc: "Featured units for lease & sale · Best for active occupiers & investors",
    accentColor: "#0891B2",
    bgColor: "#ECFEFF",
    html: () => `<table width="600" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
<tr><td style="background:#0F172A;padding:36px 40px 28px;">
  <div style="display:inline-block;background:#F59E0B;border-radius:4px;padding:4px 12px;margin-bottom:16px;">
    <span style="color:#0F172A;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;">Q4 2024 · Industrial &amp; Logistics</span>
  </div>
  <h1 style="color:#ffffff;font-size:30px;font-weight:900;margin:0 0 10px;line-height:1.2;">Available Units<br><span style="color:#38BDF8;">This Quarter</span></h1>
  <p style="color:rgba(255,255,255,.7);font-size:14px;margin:0;">Freshly shortlisted for lease &amp; sale. All verified. All actionable.</p>
</td></tr>
<tr><td style="padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="background:#2563EB;text-align:center;padding:16px 8px;" width="25%">
      <div style="color:#ffffff;font-size:22px;font-weight:900;">48</div>
      <div style="color:rgba(255,255,255,.8);font-size:10px;text-transform:uppercase;letter-spacing:.08em;">Units Available</div>
    </td>
    <td style="background:#0891B2;text-align:center;padding:16px 8px;" width="25%">
      <div style="color:#ffffff;font-size:22px;font-weight:900;">2K–50K</div>
      <div style="color:rgba(255,255,255,.8);font-size:10px;text-transform:uppercase;letter-spacing:.08em;">Sq Ft Range</div>
    </td>
    <td style="background:#F59E0B;text-align:center;padding:16px 8px;" width="25%">
      <div style="color:#0F172A;font-size:22px;font-weight:900;">$1.80–3.20</div>
      <div style="color:rgba(0,0,0,.7);font-size:10px;text-transform:uppercase;letter-spacing:.08em;">PSF/Month</div>
    </td>
    <td style="background:#16A34A;text-align:center;padding:16px 8px;" width="25%">
      <div style="color:#ffffff;font-size:22px;font-weight:900;">5+</div>
      <div style="color:rgba(255,255,255,.8);font-size:10px;text-transform:uppercase;letter-spacing:.08em;">Districts</div>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:28px 32px 8px;background:#F8FAFC;">
  <p style="color:#0F172A;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px;border-bottom:2px solid #E2E8F0;padding-bottom:10px;">Featured Listings</p>
  <div style="background:#ffffff;border-radius:10px;padding:20px;margin-bottom:12px;border:1px solid #E2E8F0;border-left:4px solid #2563EB;">
    <table width="100%"><tr>
      <td valign="top">
        <div style="display:inline-block;background:#EFF6FF;color:#2563EB;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;margin-bottom:8px;">Ramp-Up Warehouse</div>
        <div style="color:#0F172A;font-size:15px;font-weight:700;margin-bottom:4px;">Jurong Industrial Estate</div>
        <div style="color:#64748B;font-size:12px;">Unit #04-01 · 15,000 sqft · 9m ceiling · 3 dock doors</div>
      </td>
      <td valign="top" align="right" style="white-space:nowrap;">
        <div style="color:#2563EB;font-size:16px;font-weight:900;">$2.10 PSF</div>
        <div style="color:#94A3B8;font-size:11px;">per month</div>
      </td>
    </tr></table>
  </div>
  <div style="background:#ffffff;border-radius:10px;padding:20px;margin-bottom:12px;border:1px solid #E2E8F0;border-left:4px solid #0891B2;">
    <table width="100%"><tr>
      <td valign="top">
        <div style="display:inline-block;background:#ECFEFF;color:#0891B2;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;margin-bottom:8px;">Cold Chain / Reefer</div>
        <div style="color:#0F172A;font-size:15px;font-weight:700;margin-bottom:4px;">Tampines LogisPark</div>
        <div style="color:#64748B;font-size:12px;">8,500 sqft · -20°C to +5°C zones · Direct access</div>
      </td>
      <td valign="top" align="right" style="white-space:nowrap;">
        <div style="color:#0891B2;font-size:16px;font-weight:900;">$3.00 PSF</div>
        <div style="color:#94A3B8;font-size:11px;">per month</div>
      </td>
    </tr></table>
  </div>
  <div style="background:#ffffff;border-radius:10px;padding:20px;margin-bottom:12px;border:1px solid #E2E8F0;border-left:4px solid #F59E0B;">
    <table width="100%"><tr>
      <td valign="top">
        <div style="display:inline-block;background:#FFFBEB;color:#D97706;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;margin-bottom:8px;">Light Industrial · For Sale</div>
        <div style="color:#0F172A;font-size:15px;font-weight:700;margin-bottom:4px;">Changi Business Park</div>
        <div style="color:#64748B;font-size:12px;">5,000 sqft strata unit · Ground floor · Clean title</div>
      </td>
      <td valign="top" align="right" style="white-space:nowrap;">
        <div style="color:#D97706;font-size:16px;font-weight:900;">$5.8M</div>
        <div style="color:#94A3B8;font-size:11px;">asking price</div>
      </td>
    </tr></table>
  </div>
</td></tr>
<tr><td style="padding:8px 32px 24px;background:#F8FAFC;">
  <p style="color:#0F172A;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px;">Coverage Areas</p>
  <div>
    ${["Jurong","Tuas","Tampines","Changi","Ubi","Pandan","Sungei Kadut","Pioneer"].map(l => `<span style="display:inline-block;background:#E2E8F0;color:#475569;font-size:11px;font-weight:600;padding:5px 12px;border-radius:20px;margin:0 4px 6px 0;">${l}</span>`).join("")}
  </div>
</td></tr>
<tr><td style="background:#2563EB;padding:32px 40px;text-align:center;">
  <h2 style="color:#ffffff;font-size:20px;font-weight:800;margin:0 0 8px;">See All 48 Available Units</h2>
  <p style="color:rgba(255,255,255,.8);font-size:13px;margin:0 0 20px;">Including off-market units not listed publicly.</p>
  <a href="https://wa.me/6591234567" style="display:inline-block;background:#F59E0B;color:#0F172A;font-size:14px;font-weight:800;text-decoration:none;padding:13px 30px;border-radius:50px;margin:0 4px 8px;box-shadow:0 4px 12px rgba(245,158,11,.4);">💬 Get Full List via WhatsApp</a>
  <a href="mailto:hello@yourbrokerage.com" style="display:inline-block;background:rgba(255,255,255,.15);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 30px;border-radius:50px;margin:0 4px 8px;border:1px solid rgba(255,255,255,.3);">📧 Email Us Your Brief</a>
</td></tr>
<tr><td style="background:#0F172A;padding:20px 40px;text-align:center;">
  <p style="color:rgba(255,255,255,.4);font-size:11px;margin:0;line-height:1.7;">© 2024 [Your Brokerage Name] · Singapore<br>To unsubscribe, reply with "remove" to this email.</p>
</td></tr>
</table>`,
  },
  {
    id: 3,
    name: "Market Intelligence",
    desc: "Q4 2024 Singapore industrial market update · Best for maintaining mindshare",
    accentColor: "#D97706",
    bgColor: "#FFFBEB",
    html: () => `<table width="600" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
<tr><td style="background:linear-gradient(135deg,#F59E0B 0%,#D97706 100%);padding:36px 40px 28px;">
  <div style="display:inline-block;background:rgba(0,0,0,.15);border-radius:4px;padding:4px 12px;margin-bottom:16px;">
    <span style="color:rgba(255,255,255,.95);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;">Q4 2024 Market Intelligence Report</span>
  </div>
  <h1 style="color:#ffffff;font-size:30px;font-weight:900;margin:0 0 10px;line-height:1.2;">Singapore Industrial<br>Market Insights</h1>
  <p style="color:rgba(255,255,255,.9);font-size:14px;margin:0;">Key trends shaping industrial &amp; logistics real estate in Q4 2024</p>
</td></tr>
<tr><td style="padding:28px 32px;background:#FFFBEB;">
  <p style="color:#92400E;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px;">Key Market Metrics</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:0 8px 16px 0;" width="50%">
        <div style="background:#ffffff;border-radius:10px;padding:18px;border:1px solid #FDE68A;">
          <div style="color:#92400E;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Avg Rental (Jurong/Tuas)</div>
          <div style="color:#0F172A;font-size:26px;font-weight:900;line-height:1;">$2.10<span style="font-size:14px;font-weight:600;color:#64748B;"> PSF/mth</span></div>
          <div style="margin-top:8px;"><span style="background:#DCFCE7;color:#16A34A;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;">▲ +4.5% YoY</span></div>
        </div>
      </td>
      <td style="padding:0 0 16px 8px;" width="50%">
        <div style="background:#ffffff;border-radius:10px;padding:18px;border:1px solid #FDE68A;">
          <div style="color:#92400E;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Island-wide Vacancy Rate</div>
          <div style="color:#0F172A;font-size:26px;font-weight:900;line-height:1;">8.2%<span style="font-size:14px;font-weight:600;color:#64748B;"> avg</span></div>
          <div style="margin-top:8px;"><span style="background:#FEF2F2;color:#DC2626;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;">▼ -1.1% QoQ</span></div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 8px 0 0;" width="50%">
        <div style="background:#ffffff;border-radius:10px;padding:18px;border:1px solid #FDE68A;">
          <div style="color:#92400E;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Q3 2024 Transaction Volume</div>
          <div style="color:#0F172A;font-size:26px;font-weight:900;line-height:1;">S$1.3B<span style="font-size:14px;font-weight:600;color:#64748B;"> total</span></div>
          <div style="margin-top:8px;"><span style="background:#DCFCE7;color:#16A34A;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;">▲ +12% QoQ</span></div>
        </div>
      </td>
      <td style="padding:0 0 0 8px;" width="50%">
        <div style="background:#ffffff;border-radius:10px;padding:18px;border:1px solid #FDE68A;">
          <div style="color:#92400E;font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">New Supply (2025F)</div>
          <div style="color:#0F172A;font-size:26px;font-weight:900;line-height:1;">3.2M<span style="font-size:14px;font-weight:600;color:#64748B;"> sq ft</span></div>
          <div style="margin-top:8px;"><span style="background:#FEF2F2;color:#DC2626;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;">⚠ Supply pressure</span></div>
        </div>
      </td>
    </tr>
  </table>
</td></tr>
<tr><td style="padding:4px 32px 28px;background:#FFFBEB;">
  <p style="color:#92400E;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 14px;">Rental Trend — Jurong/Tuas Corridor</p>
  <div style="background:#ffffff;border-radius:10px;padding:20px;border:1px solid #FDE68A;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr style="border-bottom:1px solid #F8FAFC;"><td style="color:#475569;font-size:11px;padding:7px 0;width:80px;">Q1 2023</td><td style="padding:7px 10px;"><div style="background:linear-gradient(90deg,#F59E0B,#FBBF24);height:14px;border-radius:3px;width:55%;"></div></td><td style="color:#0F172A;font-size:12px;font-weight:700;padding:7px 0 7px 6px;">$1.75 PSF</td></tr>
      <tr style="border-bottom:1px solid #F8FAFC;"><td style="color:#475569;font-size:11px;padding:7px 0;">Q2 2023</td><td style="padding:7px 10px;"><div style="background:linear-gradient(90deg,#F59E0B,#FBBF24);height:14px;border-radius:3px;width:58%;"></div></td><td style="color:#0F172A;font-size:12px;font-weight:700;padding:7px 0 7px 6px;">$1.85 PSF</td></tr>
      <tr style="border-bottom:1px solid #F8FAFC;"><td style="color:#475569;font-size:11px;padding:7px 0;">Q3 2023</td><td style="padding:7px 10px;"><div style="background:linear-gradient(90deg,#F59E0B,#FBBF24);height:14px;border-radius:3px;width:60%;"></div></td><td style="color:#0F172A;font-size:12px;font-weight:700;padding:7px 0 7px 6px;">$1.92 PSF</td></tr>
      <tr style="border-bottom:1px solid #F8FAFC;"><td style="color:#475569;font-size:11px;padding:7px 0;">Q4 2023</td><td style="padding:7px 10px;"><div style="background:linear-gradient(90deg,#F59E0B,#FBBF24);height:14px;border-radius:3px;width:62%;"></div></td><td style="color:#0F172A;font-size:12px;font-weight:700;padding:7px 0 7px 6px;">$1.98 PSF</td></tr>
      <tr style="border-bottom:1px solid #F8FAFC;"><td style="color:#475569;font-size:11px;padding:7px 0;">Q1 2024</td><td style="padding:7px 10px;"><div style="background:linear-gradient(90deg,#F59E0B,#FBBF24);height:14px;border-radius:3px;width:64%;"></div></td><td style="color:#0F172A;font-size:12px;font-weight:700;padding:7px 0 7px 6px;">$2.02 PSF</td></tr>
      <tr style="border-bottom:1px solid #F8FAFC;"><td style="color:#475569;font-size:11px;padding:7px 0;">Q2 2024</td><td style="padding:7px 10px;"><div style="background:linear-gradient(90deg,#F59E0B,#FBBF24);height:14px;border-radius:3px;width:65%;"></div></td><td style="color:#0F172A;font-size:12px;font-weight:700;padding:7px 0 7px 6px;">$2.06 PSF</td></tr>
      <tr><td style="color:#0F172A;font-size:11px;font-weight:700;padding:7px 0;">Q3 2024</td><td style="padding:7px 10px;"><div style="background:linear-gradient(90deg,#D97706,#F59E0B);height:14px;border-radius:3px;width:66%;border:2px solid #D97706;"></div></td><td style="color:#D97706;font-size:12px;font-weight:800;padding:7px 0 7px 6px;">$2.10 PSF ▲</td></tr>
    </table>
  </div>
</td></tr>
<tr><td style="padding:4px 32px 28px;background:#FFFBEB;">
  <p style="color:#92400E;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 14px;">What This Means For You</p>
  <div style="background:#ffffff;border-radius:10px;padding:4px 20px;border:1px solid #FDE68A;">
    <div style="display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #F8FAFC;"><div style="min-width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800;color:white;margin-top:1px;">→</div><p style="color:#374151;font-size:13px;line-height:1.65;margin:0;">Tighten supply in Tampines &amp; Changi pushing rents higher — act early if you need these zones.</p></div>
    <div style="display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #F8FAFC;"><div style="min-width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800;color:white;margin-top:1px;">→</div><p style="color:#374151;font-size:13px;line-height:1.65;margin:0;">3PL consolidation driving demand for 20,000+ sqft multi-level ramp-up facilities.</p></div>
    <div style="display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #F8FAFC;"><div style="min-width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800;color:white;margin-top:1px;">→</div><p style="color:#374151;font-size:13px;line-height:1.65;margin:0;">Cold chain sector expanding rapidly; vacancy below 5% — limited window to secure units.</p></div>
    <div style="display:flex;gap:12px;align-items:flex-start;padding:14px 0;"><div style="min-width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:800;color:white;margin-top:1px;">→</div><p style="color:#374151;font-size:13px;line-height:1.65;margin:0;">Sale prices outpacing rentals; freehold industrial still a compelling long-term hold.</p></div>
  </div>
</td></tr>
<tr><td style="background:#0F172A;padding:32px 40px;text-align:center;">
  <h2 style="color:#F59E0B;font-size:20px;font-weight:800;margin:0 0 8px;">Want the Full Analysis?</h2>
  <p style="color:rgba(255,255,255,.7);font-size:13px;margin:0 0 20px;">Get our 15-page Q4 2024 Industrial Market Report — free for qualified occupiers and investors.</p>
  <a href="https://wa.me/6591234567" style="display:inline-block;background:#F59E0B;color:#0F172A;font-size:14px;font-weight:800;text-decoration:none;padding:13px 32px;border-radius:50px;box-shadow:0 4px 12px rgba(245,158,11,.4);">💬 Request the Full Report</a>
</td></tr>
<tr><td style="background:#0F172A;padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,.08);">
  <p style="color:rgba(255,255,255,.3);font-size:11px;margin:0;line-height:1.7;">© 2024 [Your Brokerage Name] · Singapore<br>To unsubscribe, reply with "remove" to this email.</p>
</td></tr>
</table>`,
  },
  {
    id: 4,
    name: "Personal Outreach",
    desc: "Direct intro from broker · Best for warm leads & referrals",
    accentColor: "#7C3AED",
    bgColor: "#F5F3FF",
    html: () => `<table width="600" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
<tr><td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 60%,#2563EB 100%);padding:44px 40px 36px;text-align:center;">
  <div style="width:72px;height:72px;background:linear-gradient(135deg,#F59E0B,#FBBF24);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px;line-height:72px;">👋</div>
  <h1 style="color:#ffffff;font-size:28px;font-weight:900;margin:0 0 12px;line-height:1.2;">Let's Connect —<br>I Can Help You Find<br><span style="color:#F59E0B;">the Right Space</span></h1>
  <p style="color:rgba(255,255,255,.8);font-size:14px;margin:0;line-height:1.6;">A personal note from your dedicated industrial real estate advisor</p>
</td></tr>
<tr><td style="padding:32px 40px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
  <p style="color:#0F172A;font-size:15px;font-weight:700;margin:0 0 6px;">Hi [First Name],</p>
  <p style="color:#475569;font-size:14px;line-height:1.75;margin:0 0 14px;">I noticed [Company Name] has been growing its Singapore operations — congratulations! Many companies at your stage are exploring how to optimise their warehousing and logistics footprint here.</p>
  <p style="color:#475569;font-size:14px;line-height:1.75;margin:0;">I specialise in industrial and 3PL properties across Singapore, and I'd love to share what's currently available — including a few off-market units that might be a great fit.</p>
</td></tr>
<tr><td style="padding:28px 40px;background:#F8FAFC;">
  <p style="color:#0F172A;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin:0 0 16px;">How I Can Help You</p>
  <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #E2E8F0;"><div style="font-size:22px;min-width:32px;">🔍</div><div><div style="color:#0F172A;font-size:14px;font-weight:700;margin-bottom:4px;">Property Sourcing</div><div style="color:#64748B;font-size:13px;line-height:1.6;">Access to 10,000+ listings including off-market. I shortlist in 48 hours.</div></div></div>
  <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #E2E8F0;"><div style="font-size:22px;min-width:32px;">🤝</div><div><div style="color:#0F172A;font-size:14px;font-weight:700;margin-bottom:4px;">Negotiation</div><div style="color:#64748B;font-size:13px;line-height:1.6;">I've handled 500+ transactions. I'll get you the best possible terms.</div></div></div>
  <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #E2E8F0;"><div style="font-size:22px;min-width:32px;">📋</div><div><div style="color:#0F172A;font-size:14px;font-weight:700;margin-bottom:4px;">Due Diligence</div><div style="color:#64748B;font-size:13px;line-height:1.6;">Lease reviews, URA zoning checks, JTC land use compliance — all covered.</div></div></div>
  <div style="display:flex;gap:16px;align-items:flex-start;padding:14px 0;"><div style="font-size:22px;min-width:32px;">📈</div><div><div style="color:#0F172A;font-size:14px;font-weight:700;margin-bottom:4px;">Market Advisory</div><div style="color:#64748B;font-size:13px;line-height:1.6;">Real benchmarks so you never overpay. Honest advice always.</div></div></div>
</td></tr>
<tr><td style="padding:24px 40px;background:#EFF6FF;border-left:4px solid #2563EB;">
  <p style="color:#1E40AF;font-size:14px;font-style:italic;font-weight:500;margin:0 0 10px;line-height:1.7;">"[Your Broker Name] found us a 20,000 sqft ramp-up facility in Jurong within 3 weeks, S$0.20 PSF below our budget. Exceptional market knowledge and zero pressure."</p>
  <p style="color:#3B82F6;font-size:12px;font-weight:700;margin:0;">— Head of Supply Chain, MNC Logistics Company · Singapore</p>
</td></tr>
<tr><td style="background:#ffffff;padding:32px 40px;text-align:center;border-top:1px solid #E2E8F0;">
  <h2 style="color:#0F172A;font-size:20px;font-weight:800;margin:0 0 6px;">No obligation. Just a conversation.</h2>
  <p style="color:#64748B;font-size:14px;margin:0 0 24px;">I'll share what's available and answer any questions you have.</p>
  <a href="https://wa.me/6591234567" style="display:inline-block;background:#25D366;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:50px;margin:0 4px 10px;box-shadow:0 4px 12px rgba(37,211,102,.35);">💬 WhatsApp</a>
  <a href="tel:+6591234567" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:50px;margin:0 4px 10px;box-shadow:0 4px 12px rgba(37,99,235,.3);">📞 +65 9XXX XXXX</a>
  <a href="mailto:you@brokerage.com" style="display:inline-block;background:#F8FAFC;color:#475569;font-size:15px;font-weight:700;text-decoration:none;padding:14px 30px;border-radius:50px;margin:0 4px 10px;border:1px solid #E2E8F0;">📧 Email Me</a>
  <div style="margin-top:20px;display:inline-block;background:#DCFCE7;border-radius:20px;padding:8px 16px;">
    <span style="color:#16A34A;font-size:12px;font-weight:600;">● Available for calls Mon–Sat, 9am–7pm SGT</span>
  </div>
</td></tr>
<tr><td style="background:#0F172A;padding:24px 40px;text-align:center;">
  <p style="color:rgba(255,255,255,.5);font-size:11px;margin:0;line-height:1.7;">[Your Name] · [Your Brokerage Name] · Singapore<br>To unsubscribe, reply with "remove" to this email.</p>
</td></tr>
</table>`,
  },
]
