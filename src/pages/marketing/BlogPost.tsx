import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { POSTS } from "./Blog";

export default function BlogPost() {
  const { slug } = useParams();
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return <Navigate to="/resources/blog" replace />;
  return (
    <MarketingLayout title={post.title}>
      <article className="container py-16 max-w-3xl">
        <Link to="/resources/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>
        <p className="text-xs text-muted-foreground mb-3">{new Date(post.date).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })} · {post.author}</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-[1.1]">{post.title}</h1>
        <p className="text-xl text-muted-foreground mb-10">{post.excerpt}</p>
        <div className="prose prose-neutral max-w-none space-y-5 text-foreground">
          <p>This is a placeholder article. We're publishing the full essay shortly — in the meantime, this post is part of our public Knowledge release built around real ACPR enforcement decisions.</p>
          <p>For early access to the full piece, drop your email on the <Link to="/contact" className="text-primary underline">contact page</Link>.</p>
        </div>
      </article>
    </MarketingLayout>
  );
}