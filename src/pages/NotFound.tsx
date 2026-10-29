import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';

export function NotFound() {
  usePageMeta('页面不存在');
  return (
    <section className="container-page py-24 text-center sm:py-32">
      <p className="num text-[88px] font-semibold leading-none tracking-[-0.08em] text-line-strong sm:text-[128px]">
        404
      </p>
      <p className="eyebrow mt-4 justify-center">Page not found</p>
      <h1 className="mt-3 font-display text-[34px] font-semibold tracking-[-0.02em] text-ink sm:text-[42px]">
        这一页没有服务
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-muted">
        链接可能已失效，或者地址输入有误。回到首页，或直接从全部服务里挑一项。
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-dark">
          <ArrowLeft size={14} /> 返回首页
        </Link>
        <Link to="/services" className="btn btn-outline">
          浏览全部服务 <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
