"use client"

import Link from "next/link"
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react"
import { motion } from "framer-motion"

export default function SiteFooter() {
  return (
    <footer className="mt-20 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4">
                GLA University
                <span className="block text-accent text-lg">Gallery</span>
              </h3>
              <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                Celebrating the vibrant campus life at GLA University. From academic achievements
                to cultural fests, sports events to farewell ceremonies — every moment matters.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-4">
                <Link
                  href="https://www.facebook.com/glauiversity"
                  target="_blank"
                  className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent transition-colors duration-300 group"
                >
                  <Facebook className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
                <Link
                  href="https://www.instagram.com/glauiversity"
                  target="_blank"
                  className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent transition-colors duration-300 group"
                >
                  <Instagram className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
                <Link
                  href="https://www.linkedin.com/school/gla-university"
                  target="_blank"
                  className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-accent transition-colors duration-300 group"
                >
                  <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4 text-accent">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                <span>17km Stone, NH-2, Mathura-Delhi Road, Mathura, UP 281406</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-accent flex-shrink-0" />
                <span>+91-5662-250900, 250909</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-accent flex-shrink-0" />
                <span>info@gla.ac.in</span>
              </li>
            </ul>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="text-lg font-semibold mb-4 text-accent">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="https://www.gla.ac.in"
                  target="_blank"
                  className="hover:text-accent transition-colors duration-300 flex items-center gap-2"
                >
                  <span>Official GLA University</span>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-accent transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-accent transition-colors duration-300">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="hover:text-accent transition-colors duration-300">
                  Clubs
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-accent transition-colors duration-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-accent transition-colors duration-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="hover:text-accent transition-colors duration-300">
                  Changelog
                </Link>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/20">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/70">
            <p>© {new Date().getFullYear()} GLA University Gallery. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <Link href="/about" className="hover:text-accent transition-colors duration-300">
                About
              </Link>
              <Link href="/privacy" className="hover:text-accent transition-colors duration-300">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-accent transition-colors duration-300">
                Terms
              </Link>
              <Link href="/faq" className="hover:text-accent transition-colors duration-300">
                FAQ
              </Link>
              <Link href="/changelog" className="hover:text-accent transition-colors duration-300">
                Changelog
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Gold accent bar */}
      <div className="h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
    </footer>
  )
}
