import { useState, useEffect } from 'react'

// Grille tarifaire (en €). Modifie ces valeurs pour ajuster les estimations.
const PRIX = {
  vol: {
    Europe: { 'Économique': 1800, 'Premium Économique': 3000, 'Affaires': 5500 },
    'Amérique du Nord': { 'Économique': 1400, 'Premium Économique': 2400, 'Affaires': 4200 },
    'Australie/NZ': { 'Économique': 1000, 'Premium Économique': 1800, 'Affaires': 3000 },
    Asie: { 'Économique': 1200, 'Premium Économique': 2200, 'Affaires': 3800 },
    Autre: { 'Économique': 1600, 'Premium Économique': 2800, 'Affaires': 5000 },
  },
  hebergement: {
    'Hôtel 3*': 200,
    'Hôtel 4*': 350,
    'Hôtel 5*': 600,
    'Pension familiale': 130,
    'Location vacances': 170,
  },
  overwaterBungalow: 650,
  locationVoiture: { Compact: 65, SUV: 90, '4x4': 120 },
  transfertsInterIles: { Bateau: 80, 'Avion (Air Tahiti)': 750, Aucun: 0 },
  restauration: { 'Économique': 35, Moyen: 65, Luxe: 130 },
  dinerSpecial: 110,
  activites: {
    'Plongée sous-marine': 95,
    'Excursion en 4x4': 110,
    'Tour en bateau à moteur': 100,
    'Visite culturelle': 40,
    Randonnée: 50,
    Spa: 130,
  },
  excursionMoyenne: 80,
  specificitesPolynesiennes: {
    'Soirée traditionnelle Tahitienne': 120,
    'Location de pirogue': 50,
    'Visite des fermes perlières': 30,
  },
  assurances: {
    'Assurance annulation': 80,
    'Assurance santé internationale': 50,
  },
}

// Coefficients saisonniers appliqués aux vols et à l'hébergement.
// Saison sèche = haute saison (plus chère), saison humide = basse saison.
const SAISON = {
  seche: {
    label: 'Saison sèche — mai à octobre (haute saison)',
    vol: 1.15,
    hebergement: 1.1,
    note: 'Saison sèche : de mai à octobre (hiver austral). Haute saison, météo idéale mais vols et hébergements plus chers.',
  },
  humide: {
    label: 'Saison humide — novembre à avril (basse saison)',
    vol: 0.85,
    hebergement: 0.9,
    note: 'Saison humide : de novembre à avril (été austral). Plus chaude et pluvieuse, mais vols et hébergements moins chers.',
  },
}

const ETAT_INITIAL = {
  participants: 2,
  dureeJours: 10,
  departDepuis: 'Europe',
  typeVol: 'Aller-retour',
  classeVol: 'Économique',
  typeHebergement: 'Hôtel 3*',
  nuitsStandard: 10,
  nuitsOverwater: 0,
  locationVoiture: 'Non',
  joursLocation: 0,
  typeVehicule: 'Compact',
  saison: 'seche',
  transfertsInterIles: 'Bateau',
  restauration: 'Moyen',
  dinersSpeciaux: 0,
  activites: [],
  excursionsPayantes: 2,
  specificitesPolynesiennes: [],
  budgetSouvenir: 200,
  assurances: [],
  fraisVisa: 0,
  margeSecurity: 10,
}

function App() {
  const [form, setForm] = useState(ETAT_INITIAL)
  const [budget, setBudget] = useState({
    total: 0, transport: 0, hebergement: 0, transportLocal: 0,
    nourriture: 0, activites: 0, specifiques: 0, assurances: 0, securite: 0,
  })

  // Cases à cocher (tableaux) et selects/texte
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (type === 'checkbox') {
      setForm((prev) =>
        checked
          ? { ...prev, [name]: [...prev[name], value] }
          : { ...prev, [name]: prev[name].filter((v) => v !== value) }
      )
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Champs numériques
  const handleNumber = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const reset = () => setForm(ETAT_INITIAL)

  useEffect(() => {
    const t = form
    const coefSaison = SAISON[t.saison]

    // Transport aérien (ajusté selon la saison)
    let transport = 0
    if (t.typeVol !== 'Je recherche déjà un billet') {
      transport = PRIX.vol[t.departDepuis][t.classeVol] * t.participants
      if (t.typeVol === 'Aller simple') transport *= 0.6
      transport *= coefSaison.vol
    }

    // Hébergement (ajusté selon la saison)
    let hebergement = PRIX.hebergement[t.typeHebergement] * t.nuitsStandard * t.participants
    hebergement += PRIX.overwaterBungalow * t.nuitsOverwater * t.participants
    hebergement *= coefSaison.hebergement

    // Transport local
    let transportLocal = 0
    if (t.locationVoiture === 'Oui') {
      transportLocal += PRIX.locationVoiture[t.typeVehicule] * t.joursLocation
    }
    transportLocal += PRIX.transfertsInterIles[t.transfertsInterIles] * t.participants

    // Nourriture
    const nourriture =
      PRIX.restauration[t.restauration] * t.dureeJours * t.participants +
      PRIX.dinerSpecial * t.dinersSpeciaux * t.participants

    // Activités
    let activites = t.excursionsPayantes * PRIX.excursionMoyenne * t.participants
    t.activites.forEach((a) => {
      activites += PRIX.activites[a] * t.participants
    })

    // Spécificités polynésiennes + souvenirs
    let specifiques = parseInt(t.budgetSouvenir) || 0
    t.specificitesPolynesiennes.forEach((s) => {
      specifiques += PRIX.specificitesPolynesiennes[s] * t.participants
    })

    // Assurances + formalités
    let assurances = parseInt(t.fraisVisa) || 0
    t.assurances.forEach((a) => {
      assurances += PRIX.assurances[a] * t.participants
    })

    const sousTotal =
      transport + hebergement + transportLocal + nourriture + activites + specifiques + assurances
    const securite = sousTotal * (parseInt(t.margeSecurity) / 100)
    const total = sousTotal + securite

    setBudget({
      total: Math.round(total),
      transport: Math.round(transport),
      hebergement: Math.round(hebergement),
      transportLocal: Math.round(transportLocal),
      nourriture: Math.round(nourriture),
      activites: Math.round(activites),
      specifiques: Math.round(specifiques),
      assurances: Math.round(assurances),
      securite: Math.round(securite),
    })
  }, [form])

  const ligne = (label, valeur) => (
    <div className="flex justify-between items-center py-2 border-b">
      <span>{label}</span>
      <span className="font-semibold">{valeur.toLocaleString()} €</span>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4 bg-blue-50 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-center text-blue-800">
        🏝️ Calculateur de Budget — Voyage en Polynésie Française
      </h1>
      <p className="text-center text-gray-600 mb-6" style={{ marginTop: '.4rem' }}>
        Estimez le coût de votre voyage en quelques clics
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ===== Formulaire ===== */}
        <div className="bg-white p-4 rounded-lg shadow">
          <form>
            {/* Informations de base */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Informations de base</h2>
              <div className="mb-3">
                <label className="block mb-1">Nombre de personnes</label>
                <input type="number" name="participants" value={form.participants} onChange={handleNumber} min="1" className="w-full p-2 border rounded" />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Durée du séjour (jours)</label>
                <input type="number" name="dureeJours" value={form.dureeJours} onChange={handleNumber} min="1" className="w-full p-2 border rounded" />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Saison / période du voyage</label>
                <select name="saison" value={form.saison} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="seche">{SAISON.seche.label}</option>
                  <option value="humide">{SAISON.humide.label}</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">{SAISON[form.saison].note}</p>
              </div>
            </div>

            {/* Transport aérien */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Transport aérien</h2>
              <div className="mb-3">
                <label className="block mb-1">Départ depuis</label>
                <select name="departDepuis" value={form.departDepuis} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="Europe">Europe</option>
                  <option value="Amérique du Nord">Amérique du Nord</option>
                  <option value="Australie/NZ">Australie/Nouvelle-Zélande</option>
                  <option value="Asie">Asie</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Type de vol</label>
                <select name="typeVol" value={form.typeVol} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="Aller-retour">Aller-retour</option>
                  <option value="Aller simple">Aller simple</option>
                  <option value="Je recherche déjà un billet">Je recherche déjà un billet</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Classe de vol</label>
                <select name="classeVol" value={form.classeVol} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="Économique">Économique</option>
                  <option value="Premium Économique">Premium Économique</option>
                  <option value="Affaires">Affaires</option>
                </select>
              </div>
            </div>

            {/* Hébergement */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Hébergement</h2>
              <div className="mb-3">
                <label className="block mb-1">Type d'hébergement</label>
                <select name="typeHebergement" value={form.typeHebergement} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="Hôtel 3*">Hôtel 3*</option>
                  <option value="Hôtel 4*">Hôtel 4*</option>
                  <option value="Hôtel 5*">Hôtel 5*</option>
                  <option value="Pension familiale">Pension familiale</option>
                  <option value="Location vacances">Location vacances</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {form.typeHebergement === 'Pension familiale'
                    ? 'Les pensions familiales sont le meilleur rapport qualité-prix en Polynésie!'
                    : ''}
                </p>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Nuits en hébergement standard</label>
                <input type="number" name="nuitsStandard" value={form.nuitsStandard} onChange={handleNumber} min="0" className="w-full p-2 border rounded" />
              </div>
              <div className="mb-3">
                <label className="block mb-1">Nuits en overwater bungalow</label>
                <input type="number" name="nuitsOverwater" value={form.nuitsOverwater} onChange={handleNumber} min="0" className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Transport local */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Transport local</h2>
              <div className="mb-3">
                <label className="block mb-1">Location de voiture</label>
                <select name="locationVoiture" value={form.locationVoiture} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="Non">Non</option>
                  <option value="Oui">Oui</option>
                </select>
              </div>
              {form.locationVoiture === 'Oui' && (
                <>
                  <div className="mb-3">
                    <label className="block mb-1">Durée de location (jours)</label>
                    <input type="number" name="joursLocation" value={form.joursLocation} onChange={handleNumber} min="1" className="w-full p-2 border rounded" />
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1">Type de véhicule</label>
                    <select name="typeVehicule" value={form.typeVehicule} onChange={handleChange} className="w-full p-2 border rounded">
                      <option value="Compact">Compact</option>
                      <option value="SUV">SUV</option>
                      <option value="4x4">4x4</option>
                    </select>
                  </div>
                </>
              )}
              <div className="mb-3">
                <label className="block mb-1">Transferts inter-îles</label>
                <select name="transfertsInterIles" value={form.transfertsInterIles} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="Bateau">Bateau</option>
                  <option value="Avion (Air Tahiti)">Avion (Air Tahiti)</option>
                  <option value="Aucun">Aucun</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {form.transfertsInterIles === 'Avion (Air Tahiti)'
                    ? 'Le pass Air Tahiti coûte entre 600€ et 800€ et permet de visiter plusieurs îles'
                    : ''}
                </p>
              </div>
            </div>

            {/* Nourriture */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Nourriture</h2>
              <div className="mb-3">
                <label className="block mb-1">Restauration quotidienne</label>
                <select name="restauration" value={form.restauration} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="Économique">Économique (roulottes/marché)</option>
                  <option value="Moyen">Moyen (snacks + 1 restaurant)</option>
                  <option value="Luxe">Luxe (restaurants hôtels)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {form.restauration === 'Économique'
                    ? 'Un repas dans une roulotte (food truck tahitien) coûte entre 12€ et 20€'
                    : ''}
                </p>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Dîners spéciaux/gastronomiques</label>
                <input type="number" name="dinersSpeciaux" value={form.dinersSpeciaux} onChange={handleNumber} min="0" className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Activités */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Activités</h2>
              <div className="mb-3">
                <label className="block mb-2">Activités principales</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Plongée sous-marine', 'Excursion en 4x4', 'Tour en bateau à moteur', 'Visite culturelle', 'Randonnée', 'Spa'].map((a) => (
                    <div className="flex items-center" key={a}>
                      <input type="checkbox" id={a} name="activites" value={a} checked={form.activites.includes(a)} onChange={handleChange} className="mr-2" />
                      <label htmlFor={a}>{a}</label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {form.activites.includes('Plongée sous-marine')
                    ? 'Une plongée sous-marine coûte entre 70€ et 120€'
                    : ''}
                </p>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Nombre d'excursions payantes</label>
                <input type="number" name="excursionsPayantes" value={form.excursionsPayantes} onChange={handleNumber} min="0" className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Spécificités polynésiennes */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Spécificités polynésiennes</h2>
              <div className="mb-3">
                <label className="block mb-2">Options spécifiques</label>
                <div className="flex flex-col gap-2">
                  {['Soirée traditionnelle Tahitienne', 'Location de pirogue', 'Visite des fermes perlières'].map((s) => (
                    <div className="flex items-center" key={s}>
                      <input type="checkbox" id={s} name="specificitesPolynesiennes" value={s} checked={form.specificitesPolynesiennes.includes(s)} onChange={handleChange} className="mr-2" />
                      <label htmlFor={s}>{s}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Budget souvenirs (€)</label>
                <input type="number" name="budgetSouvenir" value={form.budgetSouvenir} onChange={handleNumber} min="0" className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Assurance et formalités */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Assurance et formalités</h2>
              <div className="mb-3">
                <label className="block mb-2">Assurances</label>
                <div className="flex flex-col gap-2">
                  {['Assurance annulation', 'Assurance santé internationale'].map((a) => (
                    <div className="flex items-center" key={a}>
                      <input type="checkbox" id={a} name="assurances" value={a} checked={form.assurances.includes(a)} onChange={handleChange} className="mr-2" />
                      <label htmlFor={a}>{a}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="block mb-1">Frais de visa estimés (€)</label>
                <input type="number" name="fraisVisa" value={form.fraisVisa} onChange={handleNumber} min="0" className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Marge de sécurité */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-blue-700">Marge de sécurité</h2>
              <div className="mb-3">
                <label className="block mb-1">Pourcentage de marge (%)</label>
                <select name="margeSecurity" value={form.margeSecurity} onChange={handleChange} className="w-full p-2 border rounded">
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <button type="button" onClick={reset} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Réinitialiser
              </button>
            </div>
          </form>
        </div>

        {/* ===== Résultats ===== */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Estimation de votre budget</h2>

          <div className="mb-6 p-4 bg-blue-100 rounded-lg text-center">
            <p className="text-xl font-semibold">Budget total estimé</p>
            <p className="text-4xl font-bold text-blue-700">{budget.total.toLocaleString()} €</p>
            <p className="text-sm mt-2 text-gray-600">
              Pour {form.participants} {form.participants > 1 ? 'personnes' : 'personne'}, {form.dureeJours} {form.dureeJours > 1 ? 'jours' : 'jour'}
            </p>
            <p className="text-sm mt-1 text-gray-600">
              Soit environ {Math.round(budget.total / form.participants).toLocaleString()} € par personne
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold mb-3">Détail du budget</h3>
            {ligne('Transport aérien', budget.transport)}
            {ligne('Hébergement', budget.hebergement)}
            {ligne('Transport local', budget.transportLocal)}
            {ligne('Nourriture', budget.nourriture)}
            {ligne('Activités', budget.activites)}
            {ligne('Spécificités polynésiennes', budget.specifiques)}
            {ligne('Assurances et formalités', budget.assurances)}
            {ligne(`Marge de sécurité (${form.margeSecurity}%)`, budget.securite)}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">Conseils pour votre voyage</h3>
            <ul className="text-sm space-y-2">
              <li>• La période idéale pour visiter la Polynésie est de mai à octobre (saison sèche)</li>
              <li>• Réservez vos billets d'avion 6 à 8 mois à l'avance pour les meilleurs tarifs</li>
              <li>• Les pensions familiales offrent une expérience authentique à prix raisonnable</li>
              <li>• Prévoyez au moins 3 jours par île pour profiter pleinement</li>
              <li>• Les roulottes (food trucks) sont économiques et proposent une excellente cuisine locale</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barre de total collée en bas — visible sur mobile uniquement */}
      <div className="mobile-total-bar">
        <div className="mtb-info">
          <span className="mtb-label">Budget total estimé</span>
          <span className="mtb-per">
            ≈ {Math.round(budget.total / form.participants).toLocaleString()} € / personne
          </span>
        </div>
        <span className="mtb-value">{budget.total.toLocaleString()} €</span>
      </div>
    </div>
  )
}

export default App
