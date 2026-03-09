"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { GraduationCap, Users, Award, BookOpen } from "lucide-react"
import { useConfig } from "@/context/config-context"

export default function AboutSection() {
  const { config } = useConfig()

  const stats = [
    { icon: Users, label: "Students", value: "25,000+" },
    { icon: GraduationCap, label: "Programs", value: "100+" },
    { icon: Award, label: "Years", value: "25+" },
    { icon: BookOpen, label: "Departments", value: "15+" },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-12 bg-accent" />
              <span className="text-sm font-medium text-accent">About {config.name}</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
              Where Excellence Meets
              <span className="block text-accent">Innovation</span>
            </h2>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              {config.description || `${config.name} stands as a beacon of academic excellence, fostering innovation, creativity, and leadership among its diverse student community. Our campus is a melting pot of cultures, ideas, and aspirations.`}
            </p>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              From state-of-the-art laboratories to vibrant cultural fests, from competitive
              sports events to inspiring farewell ceremonies — every corner of our campus
              tells a story of growth, learning, and unforgettable memories.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-4 rounded-xl bg-accent/5 border border-accent/10"
                >
                  <stat.icon className="h-8 w-8 text-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/glacampus.jpg"
                alt="GLA University Campus - Hostel View"
                width={600}
                height={500}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="absolute -bottom-6 -left-6 bg-background p-6 rounded-xl shadow-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-primary">Academic Excellence</div>
                  <div className="text-sm text-muted-foreground">Since 1998</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
