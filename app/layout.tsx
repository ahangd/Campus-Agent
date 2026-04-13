import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "Campus Agent - \u6821\u56ed\u667a\u80fd\u54a8\u8be2\u529f\u80fd\u9875",
  description:
    "\u6781\u7b80\u767d\u8272\u98ce\u683c\u7684\u6821\u56ed\u667a\u80fd\u54a8\u8be2\u529f\u80fd\u9875\uff0c\u652f\u6301\u8bfe\u7a0b\u5b89\u6392\u3001\u56fe\u4e66\u9986\u4fe1\u606f\u3001\u6821\u56ed\u5361\u4f7f\u7528\u3001\u62a5\u4fee\u6d41\u7a0b\u548c\u89c4\u7ae0\u5236\u5ea6\u95ee\u7b54\u3002",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="bg-white text-slate-900">{children}</body>
    </html>
  )
}
