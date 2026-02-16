import FeatureSection from "@/src/components/Home/FeatureSection";
import HeroSection from "@/src/components/Home/HeroSection";

export default function Home() {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <HeroSection />


      {/* Feature Section */}
      <FeatureSection />
      
    </div>
  );
}