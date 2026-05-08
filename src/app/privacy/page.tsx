import Link from "next/link";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. Data Collection",
      content: "We collect information you provide directly to us when you create an account, generate reports, or communicate with us. This includes your name, email address, firm name, and any client data you input for report generation. We also collect technical data such as your IP address and device information for security and service optimization."
    },
    {
      title: "2. How We Use Your Data",
      content: "Your information is used to provide, maintain, and improve the Suitance platform. Specifically, we use your meeting notes to generate suitability reports using AI, process your payments, send you service-related notifications, and ensure compliance with regulatory requirements. We do not sell your personal data to third parties."
    },
    {
      title: "3. Supabase Storage & Security",
      content: "We use Supabase for our database and file storage. Your data is encrypted at rest and in transit. We implement strict access controls to ensure that only authorized personnel can access service data, and only when necessary for maintenance or support. Supabase maintains high security standards and compliance certifications."
    },
    {
      title: "4. AI Processing",
      content: "Suitance uses advanced AI models to process your meeting notes. While we use these models to generate report text, your raw notes and final reports are not used to train public AI models. Your data remains your property and is treated as confidential professional information."
    },
    {
      title: "5. Stripe Payments",
      content: "Payment processing is handled securely by Stripe. Suitance does not store your credit card details. Stripe's use of your personal information is governed by their Privacy Policy. All transactions are encrypted and processed through Stripe's secure infrastructure."
    },
    {
      title: "6. GDPR & Your Rights",
      content: "If you are located in the UK or EEA, you have certain rights under the GDPR, including the right to access, correct, or delete your personal data. You may also object to or restrict certain processing of your information. We are committed to protecting your privacy and ensuring you can exercise your rights easily."
    },
    {
      title: "7. Contact Information",
      content: "If you have any questions about this Privacy Policy or our data practices, please contact our privacy team at support@suitance.com. We aim to respond to all inquiries within 48 hours."
    }
  ];

  return (
    <main style={{ backgroundColor: "white", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 48px" }}>
        <div style={{ marginBottom: "64px" }}>
          <Link href="/" style={{ textDecoration: "none", color: "#0A1628", fontWeight: "bold", fontSize: "20px" }}>Suitance</Link>
          <h1 style={{ fontSize: "42px", fontWeight: "800", color: "#0A1628", marginTop: "32px", marginBottom: "16px" }}>Privacy Policy</h1>
          <p style={{ color: "#64748B", fontSize: "18px" }}>Last updated: May 2026</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          {sections.map((section, index) => (
            <section key={index}>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0A1628", marginBottom: "16px" }}>{section.title}</h2>
              <p style={{ color: "#374151", fontSize: "16px", lineHeight: "1.7", margin: 0 }}>{section.content}</p>
            </section>
          ))}
        </div>

        <footer style={{ marginTop: "80px", paddingTop: "40px", borderTop: "1px solid #E5E7EB", textAlign: "center" }}>
          <p style={{ color: "#64748B", fontSize: "14px" }}>© 2026 Suitance. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
