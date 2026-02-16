import { GithubIcon, LinkedinIcon, XIcon } from 'lucide-react'
import React from 'react'

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              KOSH
            </h3>
            <p className="mt-4 text-gray-600 text-sm">
              Your all-in-one platform for goal-driven saving.
            </p>
          </div>
          
          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Integrations", "Updates"]
            },
            {
              title: "Company",
              links: ["About", "Careers", "Blog", "Press"]
            },
            {
              title: "Resources",
              links: ["Help Center", "Community", "Tutorials", "API Docs"]
            }
          ].map((section, index) => (
            <div key={index}>
              <h4 className="font-medium text-gray-900 mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="#" className="text-gray-600 hover:text-blue-600 text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} KOSH. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Twitter</span>
              <XIcon />
            </a>
            <a href="https://www.linkedin.com/in/kaushik010/" className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">LinkedIn</span>
              <LinkedinIcon />
            </a>
            <a href="https://github.com/kaushik0010" className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">GitHub</span>
              <GithubIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
