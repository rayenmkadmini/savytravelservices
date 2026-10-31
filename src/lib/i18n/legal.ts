import type { Locale } from "./config";

// Plain-language legal pages describing how the platform actually processes data.
// The agency should have them reviewed by counsel before launch.
type Section = { title: string; body: string };
type LegalDoc = { updated: string; sections: Section[] };

const UPDATED = "2026-10-31";

export const privacy: Record<Locale, LegalDoc> = {
  fr: {
    updated: UPDATED,
    sections: [
      { title: "Responsable du traitement", body: "SAVY Travel Services, Avenue 18 Janvier, 3200 Tataouine, Tunisie — contact@savytravelservices.tn." },
      { title: "Données collectées", body: "Identité et coordonnées (nom, e-mail, téléphone), informations de voyage (destinations, dates, voyageurs), documents que vous choisissez de transmettre (passeport, pièces justificatives) et historique de vos demandes et paiements." },
      { title: "Finalités", body: "Organiser vos voyages et demandes de visa, vous contacter à leur sujet, émettre billets et réservations auprès de nos partenaires, encaisser les paiements et respecter nos obligations légales et comptables. La lettre d’information n’est envoyée qu’avec votre accord." },
      { title: "Destinataires", body: "Notre équipe, et uniquement dans la mesure nécessaire : compagnies aériennes, hôtels, prestataires de voyage, autorités consulaires (pour les visas) et prestataires de paiement (Konnect, Flouci)." },
      { title: "Sécurité et conservation", body: "Les documents sont stockés dans un espace privé, accessible uniquement par vous et notre équipe, via des liens temporaires. Les données sont conservées pendant la durée nécessaire au voyage, puis selon les délais légaux applicables." },
      { title: "Vos droits", body: "Conformément à la loi organique n° 2004-63 du 27 juillet 2004 relative à la protection des données à caractère personnel, vous pouvez accéder à vos données, les rectifier ou vous opposer à leur traitement en nous écrivant. Vous pouvez également saisir l’Instance Nationale de Protection des Données Personnelles (INPDP)." },
      { title: "Cookies", body: "Le site utilise uniquement des cookies nécessaires : session de connexion, langue et devise d’affichage. Aucun cookie publicitaire n’est déposé." },
    ],
  },
  en: {
    updated: UPDATED,
    sections: [
      { title: "Data controller", body: "SAVY Travel Services, Avenue 18 Janvier, 3200 Tataouine, Tunisia — contact@savytravelservices.tn." },
      { title: "Data we collect", body: "Identity and contact details (name, email, phone), travel information (destinations, dates, travellers), documents you choose to send (passport, supporting documents) and the history of your requests and payments." },
      { title: "Purposes", body: "Organising your trips and visa applications, contacting you about them, issuing tickets and reservations with our partners, collecting payments and meeting our legal and accounting obligations. The newsletter is only sent with your consent." },
      { title: "Recipients", body: "Our team and, only as far as necessary: airlines, hotels, travel suppliers, consular authorities (for visas) and payment providers (Konnect, Flouci)." },
      { title: "Security and retention", body: "Documents are stored in a private space accessible only to you and our team through temporary links. Data is kept for as long as your trip requires, then according to applicable legal retention periods." },
      { title: "Your rights", body: "Under Tunisian Organic Law No. 2004-63 of 27 July 2004 on the protection of personal data, you may access, correct or object to the processing of your data by writing to us. You may also contact the National Authority for the Protection of Personal Data (INPDP)." },
      { title: "Cookies", body: "The site only uses necessary cookies: sign-in session, display language and currency. No advertising cookies are set." },
    ],
  },
  ar: {
    updated: UPDATED,
    sections: [
      { title: "المسؤول عن المعالجة", body: "سافي للخدمات السياحية، نهج 18 جانفي، 3200 تطاوين، تونس — contact@savytravelservices.tn." },
      { title: "البيانات المجمّعة", body: "الهوية ومعلومات الاتصال (الاسم، البريد الإلكتروني، الهاتف)، معلومات السفر (الوجهات، التواريخ، المسافرون)، الوثائق التي تختار إرسالها (جواز السفر، الوثائق الثبوتية) وسجل طلباتك ومدفوعاتك." },
      { title: "الأغراض", body: "تنظيم رحلاتك وطلبات التأشيرة، والتواصل معك بشأنها، وإصدار التذاكر والحجوزات لدى شركائنا، وتحصيل المدفوعات واحترام التزاماتنا القانونية والمحاسبية. لا تُرسل النشرة الإخبارية إلا بموافقتك." },
      { title: "الجهات المتلقية", body: "فريقنا، وفي حدود الضرورة فقط: شركات الطيران، الفنادق، مزودو خدمات السفر، السلطات القنصلية (للتأشيرات) ومزودو خدمات الدفع (Konnect، Flouci)." },
      { title: "الأمان ومدة الحفظ", body: "تُحفظ الوثائق في فضاء خاص لا يمكن الوصول إليه إلا لك ولفريقنا عبر روابط مؤقتة. تُحفظ البيانات طوال المدة اللازمة للرحلة ثم وفق الآجال القانونية المعمول بها." },
      { title: "حقوقك", body: "طبقًا للقانون الأساسي عدد 63 لسنة 2004 المؤرخ في 27 جويلية 2004 المتعلق بحماية المعطيات الشخصية، يمكنك النفاذ إلى بياناتك أو تصحيحها أو الاعتراض على معالجتها بمراسلتنا. كما يمكنك اللجوء إلى الهيئة الوطنية لحماية المعطيات الشخصية." },
      { title: "ملفات تعريف الارتباط", body: "لا يستخدم الموقع إلا ملفات الارتباط الضرورية: جلسة الدخول، لغة العرض والعملة. لا توجد ملفات ارتباط إعلانية." },
    ],
  },
};

export const terms: Record<Locale, LegalDoc> = {
  fr: {
    updated: UPDATED,
    sections: [
      { title: "Objet", body: "Les présentes conditions encadrent l’utilisation du site savytravelservices.tn et les demandes de prestations adressées à SAVY Travel Services." },
      { title: "Demandes de réservation", body: "Une demande envoyée en ligne n’est pas une réservation ferme. Elle devient une réservation confirmée uniquement lorsque notre équipe en confirme par écrit le prix et la disponibilité." },
      { title: "Prix", body: "Les prix affichés « à partir de » sont indicatifs. Le prix définitif figure dans la proposition confirmée. Les montants convertis en EUR ou USD sont donnés à titre informatif ; le paiement s’effectue en dinars tunisiens sauf accord contraire." },
      { title: "Paiement", body: "Le paiement intervient après confirmation, par virement, en espèces à l’agence ou via un lien de paiement sécurisé (Konnect, Flouci). Un paiement n’est considéré comme reçu qu’après vérification par l’agence ou le prestataire de paiement." },
      { title: "Annulation et modification", body: "Vous pouvez annuler en ligne une demande non confirmée. Après confirmation, les conditions d’annulation propres à chaque prestataire (compagnie aérienne, hôtel…) s’appliquent et vous sont communiquées avec la proposition." },
      { title: "Visas", body: "L’assistance visa porte sur la préparation et le suivi du dossier. La décision appartient exclusivement aux autorités consulaires ; SAVY Travel Services ne peut garantir l’obtention d’un visa et les frais consulaires ne sont généralement pas remboursables." },
      { title: "Responsabilité du voyageur", body: "Vous êtes responsable de l’exactitude des informations transmises et de la validité de vos documents de voyage (passeport, visas, exigences sanitaires)." },
      { title: "Droit applicable", body: "Les présentes conditions sont soumises au droit tunisien." },
    ],
  },
  en: {
    updated: UPDATED,
    sections: [
      { title: "Purpose", body: "These terms govern the use of savytravelservices.tn and the service requests sent to SAVY Travel Services." },
      { title: "Booking requests", body: "A request sent online is not a firm booking. It becomes a confirmed booking only when our team confirms the price and availability in writing." },
      { title: "Prices", body: "“From” prices are indicative. The final price is stated in the confirmed proposal. Amounts converted into EUR or USD are for information only; payment is made in Tunisian dinars unless otherwise agreed." },
      { title: "Payment", body: "Payment is made after confirmation, by bank transfer, in cash at the agency or through a secure payment link (Konnect, Flouci). A payment counts as received only after verification by the agency or the payment provider." },
      { title: "Cancellation and changes", body: "You can cancel an unconfirmed request online. After confirmation, each supplier’s cancellation conditions (airline, hotel…) apply and are provided with the proposal." },
      { title: "Visas", body: "Visa assistance covers preparing and following up the application. The decision rests solely with the consular authorities; SAVY Travel Services cannot guarantee that a visa will be granted, and consular fees are generally non-refundable." },
      { title: "Traveller responsibility", body: "You are responsible for the accuracy of the information you provide and for the validity of your travel documents (passport, visas, health requirements)." },
      { title: "Governing law", body: "These terms are governed by Tunisian law." },
    ],
  },
  ar: {
    updated: UPDATED,
    sections: [
      { title: "الموضوع", body: "تنظّم هذه الشروط استخدام موقع savytravelservices.tn وطلبات الخدمات الموجهة إلى سافي للخدمات السياحية." },
      { title: "طلبات الحجز", body: "الطلب المرسل عبر الموقع ليس حجزًا نهائيًا، ولا يصبح حجزًا مؤكدًا إلا بعد أن يؤكد فريقنا السعر والتوفر كتابيًا." },
      { title: "الأسعار", body: "الأسعار المعروضة «ابتداءً من» تقريبية، ويرد السعر النهائي في العرض المؤكد. المبالغ المحوّلة إلى اليورو أو الدولار للعلم فقط، ويتم الدفع بالدينار التونسي ما لم يُتفق على خلاف ذلك." },
      { title: "الدفع", body: "يتم الدفع بعد التأكيد، بالتحويل البنكي أو نقدًا في الوكالة أو عبر رابط دفع آمن (Konnect، Flouci). لا يُعتبر الدفع مستلمًا إلا بعد التحقق منه من قبل الوكالة أو مزود خدمة الدفع." },
      { title: "الإلغاء والتعديل", body: "يمكنك إلغاء طلب غير مؤكد عبر الموقع. بعد التأكيد، تُطبَّق شروط الإلغاء الخاصة بكل مزود (شركة طيران، فندق…) وتُبلَّغ إليك مع العرض." },
      { title: "التأشيرات", body: "تشمل المساعدة في التأشيرة إعداد الملف ومتابعته. يعود القرار حصريًا إلى السلطات القنصلية، ولا يمكن لسافي ضمان الحصول على التأشيرة، والرسوم القنصلية غير قابلة للاسترجاع عادةً." },
      { title: "مسؤولية المسافر", body: "أنت مسؤول عن صحة المعلومات المقدمة وعن صلاحية وثائق سفرك (جواز السفر، التأشيرات، المتطلبات الصحية)." },
      { title: "القانون المنطبق", body: "تخضع هذه الشروط للقانون التونسي." },
    ],
  },
};
