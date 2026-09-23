import Image from "next/image";

type PreviewLabels = {
  requests: string;
  calendar: string;
  reviews: string;
};

type ProviderAppPreviewProps = {
  labels: PreviewLabels;
  locale: "ro" | "en";
  variant?: "duo" | "single" | "stack";
};

const SCREEN_PATHS = {
  ro: {
    requests: "/images/screenshots/Prestator_cereri.jpg",
    calendar: "/images/screenshots/Prestator_calendar.jpg",
    reviews: "/images/screenshots/Prestator_ecran_recenzii.jpg",
  },
  en: {
    requests: "/images/screenshots/EN/prestator_cereri.png",
    calendar: "/images/screenshots/EN/prestator_calendar.png",
    reviews: "/images/screenshots/EN/Prestator_ecran_recenzii.png",
  },
} as const;

const STACK_LAYOUT = [
  "left-[7%] top-[15%] -rotate-6 sm:left-[3%] sm:top-[12%]",
  "left-1/2 top-0 z-20 -translate-x-1/2",
  "right-[7%] top-[15%] rotate-6 sm:right-[3%] sm:top-[12%]",
] as const;

function PhonePreview({
  alt,
  className = "",
  priority = false,
  src,
}: {
  alt: string;
  className?: string;
  priority?: boolean;
  src: string;
}) {
  return (
    <div
      className={`dark:border-stroke-dark aspect-[1080/2316] overflow-hidden rounded-[1.35rem] border-[5px] border-slate-900 bg-slate-900 shadow-[0_24px_55px_-24px_rgba(15,23,42,0.65)] dark:border-slate-700 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 30vw, 160px"
        className="object-cover"
      />
    </div>
  );
}

export default function ProviderAppPreview({
  labels,
  locale,
  variant = "stack",
}: ProviderAppPreviewProps) {
  const screens = SCREEN_PATHS[locale];

  if (variant === "single") {
    return (
      <PhonePreview
        src={screens.requests}
        alt={labels.requests}
        className="relative mx-auto w-[132px] sm:w-[150px]"
      />
    );
  }

  if (variant === "duo") {
    return (
      <div
        className="relative mx-auto h-[330px] w-full max-w-[330px] sm:h-[390px]"
        aria-label={`${labels.requests}, ${labels.calendar}`}
      >
        <div className="bg-primary/20 absolute inset-x-[8%] top-[14%] h-[68%] rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute top-[8%] right-[2%] h-36 w-36 rounded-full blur-2xl" />
        <PhonePreview
          src={screens.calendar}
          alt={labels.calendar}
          className="absolute top-[13%] left-[7%] w-[43%] -rotate-6 sm:left-[4%]"
        />
        <PhonePreview
          src={screens.requests}
          alt={labels.requests}
          priority
          className="absolute top-0 right-[7%] z-10 w-[49%] rotate-3 sm:right-[4%]"
        />
      </div>
    );
  }

  const previews = [
    {
      src: screens.calendar,
      alt: labels.calendar,
      width: "w-[29%] sm:w-[35%]",
    },
    {
      src: screens.requests,
      alt: labels.requests,
      width: "w-[34%] sm:w-[35%]",
    },
    { src: screens.reviews, alt: labels.reviews, width: "w-[29%] sm:w-[35%]" },
  ];

  return (
    <div
      className="relative mt-6 h-[275px] w-full max-w-[460px] sm:h-[385px]"
      aria-label={`${labels.requests}, ${labels.calendar}, ${labels.reviews}`}
    >
      <div className="bg-primary/15 absolute inset-x-[12%] bottom-[5%] h-[55%] rounded-full blur-3xl" />
      {previews.map((preview, index) => (
        <PhonePreview
          key={preview.src}
          src={preview.src}
          alt={preview.alt}
          priority={index === 1}
          className={`absolute ${preview.width} ${STACK_LAYOUT[index]}`}
        />
      ))}
    </div>
  );
}
