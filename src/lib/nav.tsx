import { Link as RouterLink, useNavigate, useRouterState } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

/** Adapter so imported views keep their href-based links on TanStack Router. */
export function Link({ href, children, ...rest }: LinkProps) {
  if (/^(https?:|mailto:|#)/.test(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  const [path, query] = href.split("?");
  const search = query ? Object.fromEntries(new URLSearchParams(query)) : undefined;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <RouterLink to={path as any} search={search as any} {...(rest as any)}>
      {children}
    </RouterLink>
  );
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => {
      const [path, query] = href.split("?");
      const search = query ? Object.fromEntries(new URLSearchParams(query)) : {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: path as any, search: search as any });
    },
  };
}

export function usePathname() {
  return useRouterState({ select: (s) => s.location.pathname });
}

export function useSearchParams() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  return new URLSearchParams(searchStr);
}
