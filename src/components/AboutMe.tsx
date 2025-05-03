import type React from "react"
import { LanguageContext } from "../App"
import { useContext } from "react"
import Header from "./Header"
import Footer from "./Footer"

const AboutMe: React.FC = () => {
  const { t, language, setLanguage, currency, setCurrency } = useContext(LanguageContext)

  return (
    <div className="flex flex-col min-h-screen">
      <Header currency={currency} setCurrency={setCurrency} language={language} setLanguage={setLanguage} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-primary-dark">{t("aboutMeTitle")}</h1>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("aboutMeOurStory")}</h2>
            <p className="mb-4 text-gray-700">{t("aboutMeStoryParagraph1")}</p>
            <p className="mb-4 text-gray-700">{t("aboutMeStoryParagraph2")}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("aboutMeOurMission")}</h2>
            <p className="mb-4 text-gray-700">{t("aboutMeMissionParagraph")}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary-dark">{t("aboutMeQuality")}</h3>
                <p className="text-gray-700">{t("aboutMeQualityText")}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary-dark">{t("aboutMeSustainability")}</h3>
                <p className="text-gray-700">{t("aboutMeSustainabilityText")}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-primary-dark">{t("aboutMeCommunity")}</h3>
                <p className="text-gray-700">{t("aboutMeCommunityText")}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary-dark">{t("aboutMeTeam")}</h2>
            <p className="mb-6 text-gray-700">{t("aboutMeTeamIntro")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <img 
                  src="/carol_profile.jpg" 
                  alt="Carol" 
                  className="w-32 h-32 object-cover rounded-full mb-4"
                />
                <h3 className="font-semibold text-lg text-primary-dark">{t("aboutMeFounderName")}</h3>
                <p className="text-gray-600">{t("aboutMeFounderTitle")}</p>
                <p className="text-center mt-2 text-gray-700">{t("aboutMeFounderBio")}</p>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src="/tenubar_profile.png" 
                  alt="Tenubar" 
                  className="w-32 h-32 object-cover rounded-full mb-4"
                />
                <h3 className="font-semibold text-lg text-primary-dark">{t("aboutMeDesignerName")}</h3>
                <p className="text-gray-600">{t("aboutMeDesignerTitle")}</p>
                <p className="text-center mt-2 text-gray-700">{t("aboutMeDesignerBio")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default AboutMe

