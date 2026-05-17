"use client";
import { Tweet } from "react-tweet";
import { tweets } from "@/lib/data";
import { Marquee } from "@/components/magicui/marquee";

export default function SocialWall() {
  return (
    <Marquee className="py-8 px-4 w-full bg-[#EFE9D5]">
      {tweets.map((tweetId: string) => (
        <div
          key={tweetId}
          className="light min-w-[350px] max-w-xs flex-shrink-0 rounded-xl p-2"
        >
          <Tweet id={tweetId} />
        </div>
      ))}
    </Marquee>
  );
}
