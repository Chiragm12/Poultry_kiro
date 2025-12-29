"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Egg,
    Users,
    BarChart3,
    Shield,
    Clock,
    TrendingUp,
    CheckCircle,
    ArrowRight,
    Menu,
    X,
    Star,
    Zap,
    Target,
    Globe,
    ChevronRight
} from "lucide-react"

export default function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const features = [
        {
            icon: Egg,
            title: "Production Tracking",
            description: "Monitor daily egg production across all sheds with detailed analytics and efficiency metrics.",
            color: "bg-blue-500"
        },
        {
            icon: Users,
            title: "Staff Management",
            description: "Track attendance, manage roles, and monitor workforce productivity with ease.",
            color: "bg-green-500"
        },
        {
            icon: BarChart3,
            title: "Advanced Analytics",
            description: "Get insights with comprehensive reports, trends analysis, and performance dashboards.",
            color: "bg-purple-500"
        },
        {
            icon: Shield,
            title: "Secure & Reliable",
            description: "Enterprise-grade security with role-based access control and audit trails.",
            color: "bg-red-500"
        },
        {
            icon: Clock,
            title: "Real-time Updates",
            description: "Stay updated with live notifications and instant data synchronization.",
            color: "bg-orange-500"
        },
        {
            icon: TrendingUp,
            title: "Growth Optimization",
            description: "Optimize operations with AI-powered insights and performance recommendations.",
            color: "bg-indigo-500"
        }
    ]

    const benefits = [
        "Increase productivity by up to 40%",
        "Reduce operational costs significantly",
        "Improve decision making with data",
        "Streamline daily operations",
        "Ensure compliance and traceability",
        "Scale your business efficiently"
    ]

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Farm Owner",
            company: "Golden Eggs Farm",
            content: "This system transformed our operations. We've seen a 35% increase in efficiency since implementation.",
            rating: 5,
            avatar: "SJ"
        },
        {
            name: "Mike Chen",
            role: "Operations Manager",
            company: "Sunrise Poultry",
            content: "The analytics and reporting features are incredible. We can now make data-driven decisions daily.",
            rating: 5,
            avatar: "MC"
        },
        {
            name: "Emma Davis",
            role: "Farm Manager",
            company: "Heritage Farms",
            content: "User-friendly interface and powerful features. Our team adapted to it within days.",
            rating: 5,
            avatar: "ED"
        }
    ]

    const stats = [
        { value: "500+", label: "Active Farms" },
        { value: "10M+", label: "Eggs Tracked" },
        { value: "99.9%", label: "Uptime" },
        { value: "24/7", label: "Support" }
    ]

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                                <Egg className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                                PoultryPro
                            </span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Features
                            </a>
                            <a href="#benefits" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Benefits
                            </a>
                            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                Testimonials
                            </a>
                            <Link href="/auth/signin">
                                <Button variant="ghost" className="text-gray-700">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/auth/signup">
                                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg">
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100">
                        <div className="px-4 py-4 space-y-3">
                            <a href="#features" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">Features</a>
                            <a href="#benefits" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">Benefits</a>
                            <a href="#testimonials" className="block py-2 text-gray-700 hover:text-blue-600 font-medium">Testimonials</a>
                            <div className="pt-3 space-y-2">
                                <Link href="/auth/signin">
                                    <Button variant="outline" className="w-full">Sign In</Button>
                                </Link>
                                <Link href="/auth/signup">
                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 via-white to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                            <Zap className="h-4 w-4" />
                            <span className="text-sm font-medium">Trusted by 500+ Farms Worldwide</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Revolutionize Your{" "}
                            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                                Poultry Farm
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
                            Streamline operations, boost productivity, and maximize profits with our comprehensive
                            farm management system. From production tracking to staff management - we've got you covered.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <Link href="/auth/signup">
                                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-lg px-8 py-6 shadow-xl">
                                    Start Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/auth/signin">
                                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2">
                                    Sign In
                                </Button>
                            </Link>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-8">
                            No credit card required • 14-day free trial • Cancel anytime
                        </p>

                        {/* Demo Credentials */}
                        <div className="inline-block bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                            <div className="flex items-center justify-center space-x-2 mb-4">
                                <Zap className="h-5 w-5 text-blue-600" />
                                <p className="text-sm font-semibold text-gray-900">Try the Demo</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-sm">
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="font-semibold text-blue-600 mb-1">Admin</p>
                                    <p className="text-xs text-gray-600">admin@demofarm.com</p>
                                    <p className="text-xs text-gray-600">Admin123!</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="font-semibold text-green-600 mb-1">Manager</p>
                                    <p className="text-xs text-gray-600">manager@demofarm.com</p>
                                    <p className="text-xs text-gray-600">Manager123!</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <p className="font-semibold text-purple-600 mb-1">Worker</p>
                                    <p className="text-xs text-gray-600">worker1@demofarm.com</p>
                                    <p className="text-xs text-gray-600">Worker123!</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4">
                            <Target className="h-4 w-4" />
                            <span className="text-sm font-medium">Powerful Features</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Everything You Need to Manage Your Farm
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our comprehensive suite of tools helps you optimize every aspect of your poultry operation
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            return (
                                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <CardHeader>
                                        <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                                            <Icon className="h-7 w-7 text-white" />
                                        </div>
                                        <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-gray-600 text-base leading-relaxed">
                                            {feature.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0djMySDI0VjE0aDEyem0wLTEydjhIMjRWMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-4">
                            <Globe className="h-4 w-4" />
                            <span className="text-sm font-medium">Proven Results</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Transform Your Farm Operations
                        </h2>
                        <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                            Join thousands of successful farmers who have revolutionized their operations
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
                                    <div className="flex-shrink-0 w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="h-6 w-6 text-green-900" />
                                    </div>
                                    <span className="text-lg text-white font-medium">{benefit}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-3xl p-10 shadow-2xl">
                            <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                                Join the revolution in poultry farm management. Start your free trial today and see the difference.
                            </p>
                            <Link href="/auth/signup">
                                <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-lg py-6 shadow-xl">
                                    Start Your Free Trial
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <p className="text-center text-sm text-gray-500 mt-4">
                                No credit card required • 14-day free trial
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full mb-4">
                            <Star className="h-4 w-4" />
                            <span className="text-sm font-medium">Customer Stories</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Loved by Farm Owners Worldwide
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            See what our customers have to say about their experience
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                                <CardContent className="p-8">
                                    <div className="flex mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                        ))}
                                    </div>
                                    <p className="text-gray-700 mb-6 text-lg leading-relaxed italic">
                                        "{testimonial.content}"
                                    </p>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{testimonial.name}</p>
                                            <p className="text-sm text-gray-600">{testimonial.role}</p>
                                            <p className="text-sm text-blue-600 font-medium">{testimonial.company}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Ready to Transform Your Farm?
                    </h2>
                    <p className="text-xl text-gray-600 mb-10">
                        Join thousands of successful farmers and start optimizing your operations today.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/signup">
                            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-lg px-10 py-6 shadow-xl">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="/auth/signin">
                            <Button variant="outline" size="lg" className="text-lg px-10 py-6 border-2">
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-3 mb-4 md:mb-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                                <Egg className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold">PoultryPro</span>
                        </div>
                        <div className="text-gray-400">
                            © 2024 PoultryPro. All rights reserved. Built with ❤️ for farmers.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}