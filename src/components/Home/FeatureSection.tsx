import React from 'react'

const FeatureSection = () => {
  return (
    <section className="py-16">
    <div className="text-center">
        <h2 className="text-3xl md:text-5xl sm:text-4xl font-bold">Powerful Features</h2>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
        Everything you need to save effectively
        </p>
    </div>

    <div className="mt-16 grid md:grid-cols-3 gap-8">
        {[
            {
                title: "Automated Group Savings",
                description: "Create public or private saving groups with recurring contributions, deadlines, and penalties.",
                icon: "👥"
            },
            {
                title: "Individual Campaigns",
                description: "Users can start personal saving plans with custom amount, duration, and progress tracking.",
                icon: "💰"
            },
            {
                title: "Wallet System",
                description: "Secure in-app wallet to fund savings, with top-up history, balance checks, and contribution handling.",
                icon: "👛"
            },
            {
                title: "Contribution Tracking",
                description: "Monitor monthly payments with on-time vs late logic, penalty enforcement, and campaign status.",
                icon: "📅"
            },
            {
                title: "Group Membership Control",
                description: "Join/leave groups with admin approval, entry criteria, and join history to prevent abuse.",
                icon: "🔐"
            },
            {
                title: "User Dashboard",
                description: "Unified dashboard showing wallet balance, top-up logs, group involvement, and savings progress.",
                icon: "📊"
            }
        ].map((feature, index) => (
            <div key={index} className="bg-gray-100 p-8 rounded-xl hover:shadow-sm transition-shadow">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-gray-700">{feature.description}</p>
            </div>
            ))
        }
    </div>
    </section>
  )
}

export default FeatureSection
