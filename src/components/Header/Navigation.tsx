import Link from "next/link"

const NavigationComponent = ({ className="" }) => {
    const navItems = [
        { name: "Home", href: "/" },
        { name: "Features", href: "#" },
        { name: "Groups", href: "/groups" },
        { name: "About", href: "#" },
        { name: "FAQs", href: "#" },
    ]
  return (
    <nav className={`flex items-center gap-4 ${className}`}>
        {navItems.map((item) => (
            <Link 
            key={item.name}
            href={item.href}
            className="w-full text-left py-2 px-3 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
            >
                {item.name}
            </Link>
        ))}
    </nav>
  )
}

export default NavigationComponent
