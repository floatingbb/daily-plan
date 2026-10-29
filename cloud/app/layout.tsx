import type { Metadata } from "next";

export const metadata: Metadata = { title: "每日事件工作台", description: "每日事件安排，电脑手机同步。" };

export default function RootLayout({children}: {children: React.ReactNode}) {

 return <html lang="zh-CN"><body style={{margin:0}}>{children}</body></html>;

}

