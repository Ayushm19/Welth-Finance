"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SignInDialog } from "@/components/sign-in-dialog";

const HeroSection = () => {
  const imageRef = useRef(null);
  const { status } = useSession();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const imageElement = imageRef.current;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("scrolled");
      } else {
        imageElement.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (status === "authenticated") {
      router.push("/dashboard");
      return;
    }
    setAuthOpen(true);
  };

  return (
    <>
      <section className="pt-40 pb-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-8xl lg:text-[105px] pb-6 gradient-title">
            Manage Your Finances <br /> with Intelligence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            An AI-powered financial management platform that helps you track,
            analyze, and optimize your spending with real-time insights.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="px-8" onClick={handleGetStarted}>
              Get Started
            </Button>
            <Link href="https://www.loom.com/share/7cfedc6a06814d1f89aef7f115fca389?sid=cab956ee-b36d-425c-a54c-6f2254b6c6e9">
              <Button size="lg" variant="outline" className="px-8">
                Watch Demo
              </Button>
            </Link>
          </div>
          <div className="hero-image-wrapper mt-5 md:mt-0">
            <div ref={imageRef} className="hero-image">
              <Image
                src="/hero-finan.jpg"
                width={1280}
                height={720}
                alt="Dashboard Preview"
                className="rounded-lg shadow-2xl border mx-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <SignInDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
};

export default HeroSection;
