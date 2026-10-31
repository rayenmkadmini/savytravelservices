-- =====================================================================
-- SAVY TRAVEL SERVICES — DEMO CATALOG (development / staging only)
-- Applied automatically by `supabase db reset` locally.
-- Do NOT run in production as-is: review every item in Admin first.
--   * Destination descriptions are factual overviews.
--   * Packages have NO price (shown as "price on request") and their
--     itineraries are illustrative — the agency must replace them.
--   * Visa information is indicative and must be verified before publishing.
--   * No testimonials are seeded (reviews must come from real customers).
-- Photos: Wikimedia Commons (credited, licence in image_credit) and Unsplash.
-- Run "Admin → Media → Import external images" to copy Commons photos into
-- Supabase Storage before going live.
-- =====================================================================

insert into public.destinations (slug, name, country, tagline, description, region, image_url, image_credit, is_featured, is_published, sort_order) values
('djerba',
 '{"fr":"Djerba","en":"Djerba","ar":"جربة"}', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}',
 '{"fr":"L’île aux plages de sable fin","en":"The island of fine sandy beaches","ar":"جزيرة الشواطئ الذهبية"}',
 '{"fr":"Plus grande île d’Afrique du Nord, Djerba associe longues plages, villages de potiers à Guellala, la synagogue de la Ghriba et les ruelles colorées de Houmt Souk.\n\nIdéale pour un séjour balnéaire en famille, une escapade thalasso ou un point de départ vers le sud tunisien.","en":"North Africa’s largest island, Djerba combines long beaches, the potters’ village of Guellala, the El Ghriba synagogue and the colourful lanes of Houmt Souk.\n\nIdeal for a family beach holiday, a thalasso break or as a gateway to southern Tunisia.","ar":"جربة أكبر جزيرة في شمال إفريقيا، تجمع بين الشواطئ الطويلة وقرية الفخار قلالة وكنيس الغريبة وأزقة حومة السوق الملونة.\n\nمثالية لعطلة شاطئية عائلية أو استراحة علاج بمياه البحر أو كنقطة انطلاق نحو الجنوب التونسي."}',
 'tunisia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Djerba-Boats_on_the_beach-sky_walker.jpg/1280px-Djerba-Boats_on_the_beach-sky_walker.jpg', 'Henning Leweke · CC BY-SA 2.0', true, true, 1),
('sidi-bou-said',
 '{"fr":"Sidi Bou Saïd","en":"Sidi Bou Said","ar":"سيدي بوسعيد"}', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}',
 '{"fr":"Le village bleu et blanc","en":"The blue-and-white village","ar":"القرية الزرقاء والبيضاء"}',
 '{"fr":"Perché au-dessus du golfe de Tunis, Sidi Bou Saïd est célèbre pour ses portes bleues, ses moucharabiehs et ses cafés en terrasse face à la mer. À quelques minutes des ruines de Carthage.","en":"Perched above the Gulf of Tunis, Sidi Bou Said is famous for its blue doors, latticed windows and terrace cafés overlooking the sea — minutes from the ruins of Carthage.","ar":"تطل سيدي بوسعيد على خليج تونس، وتشتهر بأبوابها الزرقاء ومشربياتها ومقاهيها المطلة على البحر، على بعد دقائق من آثار قرطاج."}',
 'tunisia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Sidi_Bou_Said_02.jpg/1280px-Sidi_Bou_Said_02.jpg', 'Rene Cortin · CC BY-SA 4.0', true, true, 2),
('tozeur',
 '{"fr":"Tozeur","en":"Tozeur","ar":"توزر"}', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}',
 '{"fr":"Oasis, palmeraies et portes du Sahara","en":"Oases, palm groves and the gates of the Sahara","ar":"واحات ونخيل وبوابة الصحراء"}',
 '{"fr":"Tozeur, au bord du Chott el-Jérid, abrite une immense palmeraie, une médina en briques ocre et les oasis de montagne de Chebika, Tamerza et Midès.","en":"Tozeur, on the edge of Chott el-Jerid, is home to a vast palm grove, an ochre-brick medina and the mountain oases of Chebika, Tamerza and Mides.","ar":"تقع توزر على حافة شط الجريد، وتضم واحة نخيل شاسعة ومدينة عتيقة من الآجر وواحات جبلية مثل الشبيكة وتمغزة وميداس."}',
 'tunisia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Inside_Tozeur_Oasis_02.jpg/1280px-Inside_Tozeur_Oasis_02.jpg', 'Houss 2020 · CC0', true, true, 3),
('tataouine',
 '{"fr":"Tataouine","en":"Tataouine","ar":"تطاوين"}', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}',
 '{"fr":"Ksour berbères et paysages du Grand Sud","en":"Berber ksour and Deep South landscapes","ar":"القصور الأمازيغية ومناظر الجنوب"}',
 '{"fr":"Notre région : ksour fortifiés comme Ouled Soltane, villages perchés de Chenini et Douiret, et routes spectaculaires vers le désert.","en":"Our home region: fortified granaries such as Ouled Soltane, the hilltop villages of Chenini and Douiret, and spectacular roads into the desert.","ar":"منطقتنا: قصور محصنة مثل قصر أولاد سلطان، وقرى جبلية مثل شنني والدويرات، وطرق خلابة نحو الصحراء."}',
 'tunisia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Ksar_Ouled_Soltane_01.jpg/1280px-Ksar_Ouled_Soltane_01.jpg', 'Ian Sewell · CC BY 2.5', true, true, 4),
('hammamet',
 '{"fr":"Hammamet","en":"Hammamet","ar":"الحمامات"}', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}',
 '{"fr":"Médina en bord de mer et plages","en":"Seaside medina and beaches","ar":"مدينة عتيقة على البحر وشواطئ"}',
 '{"fr":"Station balnéaire historique du cap Bon, Hammamet offre une médina fortifiée au bord de l’eau, de longues plages et un large choix d’hôtels.","en":"A historic resort on Cap Bon, Hammamet offers a walled medina by the sea, long beaches and a wide choice of hotels.","ar":"الحمامات منتجع تاريخي في الوطن القبلي، يضم مدينة عتيقة مسوّرة على البحر وشواطئ طويلة وخيارًا واسعًا من الفنادق."}',
 'tunisia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/A_beach_in_Hammamet_during_the_summer.jpg/1280px-A_beach_in_Hammamet_during_the_summer.jpg', 'Faresbenrayana · CC BY-SA 4.0', false, true, 5),
('el-jem',
 '{"fr":"El Jem","en":"El Jem","ar":"الجم"}', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}',
 '{"fr":"L’amphithéâtre romain classé UNESCO","en":"The UNESCO-listed Roman amphitheatre","ar":"المسرح الروماني المصنف لدى اليونسكو"}',
 '{"fr":"L’amphithéâtre d’El Jem, inscrit au patrimoine mondial de l’UNESCO, est l’un des mieux conservés du monde romain.","en":"The amphitheatre of El Jem, a UNESCO World Heritage Site, is one of the best-preserved in the Roman world.","ar":"مسرح الجم الأثري، المدرج ضمن التراث العالمي لليونسكو، من أفضل المسارح الرومانية المحفوظة في العالم."}',
 'tunisia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Anfiteatro%2C_El_Jem%2C_T%C3%BAnez%2C_2016-09-04%2C_DD_08.jpg/1280px-Anfiteatro%2C_El_Jem%2C_T%C3%BAnez%2C_2016-09-04%2C_DD_08.jpg', 'Diego Delso · CC BY-SA 4.0', false, true, 6),
('tunis',
 '{"fr":"Tunis","en":"Tunis","ar":"تونس العاصمة"}', '{"fr":"Tunisie","en":"Tunisia","ar":"تونس"}',
 '{"fr":"Médina, souks et musée du Bardo","en":"Medina, souks and the Bardo Museum","ar":"المدينة العتيقة والأسواق ومتحف باردو"}',
 '{"fr":"La médina de Tunis, inscrite à l’UNESCO, déroule ses souks autour de la mosquée Zitouna. Le musée du Bardo abrite l’une des plus riches collections de mosaïques romaines.","en":"The UNESCO-listed medina of Tunis unfolds its souks around the Zitouna mosque. The Bardo Museum holds one of the richest collections of Roman mosaics.","ar":"تمتد أسواق مدينة تونس العتيقة، المصنفة لدى اليونسكو، حول جامع الزيتونة. ويضم متحف باردو واحدة من أغنى مجموعات الفسيفساء الرومانية."}',
 'tunisia', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Souq_in_the_Medina_of_Tunis_01.jpg/1280px-Souq_in_the_Medina_of_Tunis_01.jpg', 'Kritzolina · CC BY-SA 4.0', false, true, 7),
('istanbul',
 '{"fr":"Istanbul","en":"Istanbul","ar":"إسطنبول"}', '{"fr":"Turquie","en":"Türkiye","ar":"تركيا"}',
 '{"fr":"Entre Europe et Asie","en":"Between Europe and Asia","ar":"بين أوروبا وآسيا"}',
 '{"fr":"Mosquée Bleue, Sainte-Sophie, Grand Bazar et croisière sur le Bosphore : Istanbul est l’une des destinations préférées des voyageurs tunisiens.","en":"Blue Mosque, Hagia Sophia, the Grand Bazaar and a Bosphorus cruise: Istanbul is a favourite with Tunisian travellers.","ar":"الجامع الأزرق وآيا صوفيا والبازار الكبير ورحلة في البوسفور: إسطنبول من أحب الوجهات إلى المسافرين التونسيين."}',
 'international', 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1600&q=75', null, true, true, 10),
('paris',
 '{"fr":"Paris","en":"Paris","ar":"باريس"}', '{"fr":"France","en":"France","ar":"فرنسا"}',
 '{"fr":"La ville lumière","en":"The City of Light","ar":"مدينة الأنوار"}',
 '{"fr":"Musées, quartiers historiques et bords de Seine : Paris se découvre en long week-end comme en séjour prolongé.","en":"Museums, historic districts and the banks of the Seine: Paris works for a long weekend or a longer stay.","ar":"متاحف وأحياء تاريخية وضفاف نهر السين: تُكتشف باريس في عطلة نهاية أسبوع أو في إقامة أطول."}',
 'international', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=75', null, true, true, 11),
('dubai',
 '{"fr":"Dubaï","en":"Dubai","ar":"دبي"}', '{"fr":"Émirats arabes unis","en":"United Arab Emirates","ar":"الإمارات العربية المتحدة"}',
 '{"fr":"Architecture futuriste et désert","en":"Futuristic skyline and desert","ar":"عمارة مستقبلية وصحراء"}',
 '{"fr":"Gratte-ciel, centres commerciaux, plages et safaris dans le désert : Dubaï se prête aux séjours en famille comme aux voyages d’affaires.","en":"Skyscrapers, malls, beaches and desert safaris: Dubai suits family holidays and business trips alike.","ar":"ناطحات سحاب ومراكز تسوق وشواطئ ورحلات صحراوية: دبي مناسبة للعطلات العائلية ورحلات الأعمال."}',
 'international', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=75', null, false, true, 12),
('cairo',
 '{"fr":"Le Caire","en":"Cairo","ar":"القاهرة"}', '{"fr":"Égypte","en":"Egypt","ar":"مصر"}',
 '{"fr":"Les pyramides de Gizeh","en":"The pyramids of Giza","ar":"أهرامات الجيزة"}',
 '{"fr":"Pyramides de Gizeh, Grand Musée égyptien et croisières sur le Nil vers Louxor et Assouan.","en":"The Giza pyramids, the Grand Egyptian Museum and Nile cruises towards Luxor and Aswan.","ar":"أهرامات الجيزة والمتحف المصري الكبير ورحلات نيلية نحو الأقصر وأسوان."}',
 'international', 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1600&q=75', null, false, true, 13),
('rome',
 '{"fr":"Rome","en":"Rome","ar":"روما"}', '{"fr":"Italie","en":"Italy","ar":"إيطاليا"}',
 '{"fr":"La ville éternelle","en":"The Eternal City","ar":"المدينة الخالدة"}',
 '{"fr":"Colisée, forum romain, Vatican et places animées : Rome est une leçon d’histoire à ciel ouvert.","en":"The Colosseum, the Roman Forum, the Vatican and lively piazzas: Rome is an open-air history lesson.","ar":"الكولوسيوم والمنتدى الروماني والفاتيكان والساحات النابضة بالحياة: روما درس تاريخ في الهواء الطلق."}',
 'international', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1600&q=75', null, false, true, 14),
('marrakech',
 '{"fr":"Marrakech","en":"Marrakech","ar":"مراكش"}', '{"fr":"Maroc","en":"Morocco","ar":"المغرب"}',
 '{"fr":"La ville ocre au pied de l’Atlas","en":"The ochre city beneath the Atlas","ar":"المدينة الحمراء عند سفوح الأطلس"}',
 '{"fr":"Place Jemaa el-Fna, jardins Majorelle, riads et excursions dans l’Atlas.","en":"Jemaa el-Fna square, the Majorelle gardens, riads and excursions into the Atlas.","ar":"ساحة جامع الفنا وحدائق ماجوريل والرياضات ورحلات إلى جبال الأطلس."}',
 'international', 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1600&q=75', null, false, true, 15);

-- Packages: illustrative programmes, no prices (price on request).
insert into public.travel_packages (slug, destination_id, title, summary, category, duration_days, duration_nights, price_from, included, excluded, itinerary, cover_image_url, is_featured, is_published, sort_order)
select v.slug, d.id, v.title::jsonb, v.summary::jsonb, v.category, v.days, v.nights, null, v.included::jsonb, v.excluded::jsonb, v.itinerary::jsonb, v.cover, true, true, v.sort
from (values
  ('istanbul-decouverte', 'istanbul',
   '{"fr":"Istanbul, entre deux continents","en":"Istanbul, between two continents","ar":"إسطنبول بين قارتين"}',
   '{"fr":"Sultanahmet, Grand Bazar et croisière sur le Bosphore, avec vols depuis Tunis.","en":"Sultanahmet, the Grand Bazaar and a Bosphorus cruise, with flights from Tunis.","ar":"السلطان أحمد والبازار الكبير ورحلة في البوسفور، مع رحلات جوية من تونس."}',
   'culture', 5, 4,
   '{"fr":"Vols aller-retour Tunis – Istanbul\nHôtel 4 étoiles avec petit-déjeuner\nTransferts aéroport\nCroisière sur le Bosphore","en":"Return flights Tunis – Istanbul\n4-star hotel with breakfast\nAirport transfers\nBosphorus cruise","ar":"تذاكر ذهاب وعودة تونس – إسطنبول\nفندق 4 نجوم مع فطور الصباح\nالنقل من وإلى المطار\nرحلة في البوسفور"}',
   '{"fr":"Repas non mentionnés\nEntrées des monuments\nAssurance voyage","en":"Meals not mentioned\nMonument entrance fees\nTravel insurance","ar":"الوجبات غير المذكورة\nتذاكر دخول المعالم\nتأمين السفر"}',
   '[{"day":1,"title":{"fr":"Arrivée à Istanbul","en":"Arrival in Istanbul","ar":"الوصول إلى إسطنبول"}},{"day":2,"title":{"fr":"Sultanahmet","en":"Sultanahmet","ar":"السلطان أحمد"},"description":{"fr":"Mosquée Bleue, Sainte-Sophie et citerne Basilique.","en":"Blue Mosque, Hagia Sophia and the Basilica Cistern.","ar":"الجامع الأزرق وآيا صوفيا وصهريج البازيليك."}},{"day":3,"title":{"fr":"Bosphore et bazars","en":"Bosphorus and bazaars","ar":"البوسفور والأسواق"}},{"day":4,"title":{"fr":"Journée libre","en":"Free day","ar":"يوم حر"}},{"day":5,"title":{"fr":"Retour à Tunis","en":"Return to Tunis","ar":"العودة إلى تونس"}}]',
   'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=75', 1),
  ('djerba-sejour-famille', 'djerba',
   '{"fr":"Djerba en famille","en":"Djerba family stay","ar":"جربة مع العائلة"}',
   '{"fr":"Une semaine en bord de mer, avec une journée à Houmt Souk et Guellala.","en":"A week by the sea, with a day in Houmt Souk and Guellala.","ar":"أسبوع على شاطئ البحر مع يوم في حومة السوق وقلالة."}',
   'family', 8, 7,
   '{"fr":"Hôtel en formule demi-pension\nTransferts depuis l’aéroport de Djerba\nExcursion Houmt Souk – Guellala","en":"Hotel on half board\nTransfers from Djerba airport\nHoumt Souk – Guellala excursion","ar":"فندق بنظام نصف إقامة\nالنقل من مطار جربة\nجولة حومة السوق – قلالة"}',
   '{"fr":"Vols intérieurs (sur demande)\nDépenses personnelles","en":"Domestic flights (on request)\nPersonal expenses","ar":"الرحلات الداخلية (عند الطلب)\nالمصاريف الشخصية"}',
   '[]', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Djerba-Boats_on_the_beach-sky_walker.jpg/1280px-Djerba-Boats_on_the_beach-sky_walker.jpg', 2),
  ('grand-sud-ksour', 'tataouine',
   '{"fr":"Grand Sud : ksour et désert","en":"Deep South: ksour and desert","ar":"الجنوب الكبير: القصور والصحراء"}',
   '{"fr":"Ksar Ouled Soltane, Chenini, Douz et Tozeur en circuit accompagné.","en":"Ksar Ouled Soltane, Chenini, Douz and Tozeur on a guided tour.","ar":"قصر أولاد سلطان وشنني ودوز وتوزر في جولة مصحوبة."}',
   'adventure', 4, 3,
   '{"fr":"Véhicule 4x4 avec chauffeur-guide\nHébergements en hôtel et campement\nPetits-déjeuners et dîners","en":"4x4 vehicle with driver-guide\nHotel and desert camp nights\nBreakfasts and dinners","ar":"سيارة رباعية الدفع مع سائق مرشد\nإقامة في فنادق ومخيم صحراوي\nفطور الصباح والعشاء"}',
   '{"fr":"Déjeuners\nPourboires","en":"Lunches\nTips","ar":"وجبات الغداء\nالإكراميات"}',
   '[{"day":1,"title":{"fr":"Tataouine et ksour","en":"Tataouine and the ksour","ar":"تطاوين والقصور"}},{"day":2,"title":{"fr":"Chenini et Douiret","en":"Chenini and Douiret","ar":"شنني والدويرات"}},{"day":3,"title":{"fr":"Douz, nuit en campement","en":"Douz, night in a desert camp","ar":"دوز وليلة في المخيم"}},{"day":4,"title":{"fr":"Tozeur et retour","en":"Tozeur and return","ar":"توزر والعودة"}}]',
   'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Ksar_Ouled_Soltane_01.jpg/1280px-Ksar_Ouled_Soltane_01.jpg', 3)
) as v(slug, dest, title, summary, category, days, nights, included, excluded, itinerary, cover, sort)
join public.destinations d on d.slug = v.dest;

insert into public.visa_countries (slug, iso_code, name, overview, is_published, sort_order) values
('france', 'FR', '{"fr":"France (espace Schengen)","en":"France (Schengen area)","ar":"فرنسا (فضاء شنغن)"}',
 '{"fr":"Les ressortissants tunisiens ont besoin d’un visa Schengen de court séjour pour se rendre en France. La demande se dépose auprès du prestataire désigné par le consulat.","en":"Tunisian nationals need a short-stay Schengen visa to travel to France. Applications are lodged with the consulate’s appointed service provider.","ar":"يحتاج المواطنون التونسيون إلى تأشيرة شنغن قصيرة الإقامة للسفر إلى فرنسا. يُودع الطلب لدى مقدم الخدمة المعتمد من القنصلية."}', true, 1),
('canada', 'CA', '{"fr":"Canada","en":"Canada","ar":"كندا"}',
 '{"fr":"Un visa de résident temporaire est généralement requis pour les ressortissants tunisiens, avec relevé des données biométriques.","en":"A temporary resident visa is generally required for Tunisian nationals, with biometrics collection.","ar":"تُشترط عادة تأشيرة إقامة مؤقتة للمواطنين التونسيين مع أخذ البيانات البيومترية."}', true, 2);

insert into public.visa_types (country_id, category, name, required_documents, processing_time, fee_info, sort_order)
select c.id, 'tourist',
 '{"fr":"Visa Schengen court séjour (tourisme)","en":"Short-stay Schengen visa (tourism)","ar":"تأشيرة شنغن قصيرة الإقامة (سياحة)"}',
 '{"fr":"Passeport valide au moins 3 mois après le retour\nFormulaire de demande signé\nPhotos d’identité récentes\nAssurance voyage (couverture minimale 30 000 €)\nJustificatifs d’hébergement et réservation de vol\nJustificatifs de ressources (relevés bancaires)\nJustificatif de situation professionnelle","en":"Passport valid at least 3 months after return\nSigned application form\nRecent ID photos\nTravel insurance (minimum €30,000 cover)\nAccommodation proof and flight reservation\nProof of funds (bank statements)\nProof of employment status","ar":"جواز سفر صالح 3 أشهر على الأقل بعد العودة\nاستمارة طلب موقعة\nصور شمسية حديثة\nتأمين سفر (تغطية 30000 يورو على الأقل)\nإثبات الإقامة وحجز الطيران\nإثبات الموارد (كشوفات بنكية)\nإثبات الوضعية المهنية"}',
 '{"fr":"Environ 15 jours après le rendez-vous (variable)","en":"About 15 days after the appointment (varies)","ar":"حوالي 15 يومًا بعد الموعد (متغير)"}',
 '{"fr":"Frais consulaires selon le barème Schengen en vigueur, plus frais du prestataire","en":"Consular fee per the current Schengen schedule, plus service provider fee","ar":"رسوم قنصلية حسب جدول شنغن المعمول به، إضافة إلى رسوم مقدم الخدمة"}', 1
from public.visa_countries c where c.slug = 'france';

insert into public.visa_types (country_id, category, name, required_documents, processing_time, sort_order)
select c.id, 'tourist',
 '{"fr":"Visa de résident temporaire (visiteur)","en":"Temporary resident visa (visitor)","ar":"تأشيرة إقامة مؤقتة (زائر)"}',
 '{"fr":"Passeport valide\nFormulaires de demande en ligne\nPhotos numériques\nPreuves de ressources financières\nLettre d’invitation (le cas échéant)\nDonnées biométriques","en":"Valid passport\nOnline application forms\nDigital photos\nProof of financial means\nInvitation letter (if applicable)\nBiometrics","ar":"جواز سفر صالح\nاستمارات الطلب الإلكترونية\nصور رقمية\nإثبات الموارد المالية\nرسالة دعوة (إن وجدت)\nالبيانات البيومترية"}',
 '{"fr":"Variable — consulter les délais publiés par IRCC","en":"Varies — check processing times published by IRCC","ar":"متغير — راجع الآجال المنشورة من IRCC"}', 1
from public.visa_countries c where c.slug = 'canada';

insert into public.articles (slug, title, excerpt, body, cover_image_url, is_published) values
('preparer-demande-visa-schengen',
 '{"fr":"Préparer sa demande de visa Schengen sereinement","en":"Preparing your Schengen visa application calmly","ar":"التحضير لطلب تأشيرة شنغن بهدوء"}',
 '{"fr":"Anticipation, cohérence du dossier et justificatifs : nos conseils pratiques.","en":"Planning ahead, a consistent file and supporting documents: our practical advice.","ar":"التخطيط المسبق وتناسق الملف والوثائق الداعمة: نصائحنا العملية."}',
 '{"fr":"## Anticiper\n\nLes rendez-vous peuvent être rares en haute saison. Prévoyez votre demande plusieurs semaines avant le départ.\n\n## Un dossier cohérent\n\nDates de voyage, réservations et assurance doivent correspondre. Un dossier clair facilite l’examen.\n\n## Aucune garantie\n\nLa décision appartient au consulat. Notre rôle est de vous aider à présenter un dossier complet et soigné.","en":"## Plan ahead\n\nAppointments can be scarce in high season. Apply several weeks before departure.\n\n## A consistent file\n\nTravel dates, bookings and insurance must match. A clear file is easier to assess.\n\n## No guarantee\n\nThe decision belongs to the consulate. Our role is to help you present a complete, careful application.","ar":"## التخطيط المسبق\n\nقد تكون المواعيد نادرة في موسم الذروة. قدّم طلبك قبل السفر بعدة أسابيع.\n\n## ملف متناسق\n\nيجب أن تتطابق تواريخ السفر والحجوزات والتأمين. الملف الواضح أسهل في الدراسة.\n\n## لا ضمانات\n\nالقرار يعود إلى القنصلية. دورنا مساعدتك على تقديم ملف كامل ومتقن."}',
 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=75', true);
