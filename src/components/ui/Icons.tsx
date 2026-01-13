import React from 'react'

interface IconProps {
    className?: string
    size?: number
}


export const SparkleIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
            fill="currentColor"
        />
        <path
            d="M19 3L19.5 5.5L22 6L19.5 6.5L19 9L18.5 6.5L16 6L18.5 5.5L19 3Z"
            fill="currentColor"
        />
        <path
            d="M19 15L19.5 17.5L22 18L19.5 18.5L19 21L18.5 18.5L16 18L18.5 17.5L19 15Z"
            fill="currentColor"
        />
    </svg>
)


export const CarIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M5 11L6.5 6.5C6.77614 5.73835 7.51093 5.25 8.32558 5.25H15.6744C16.4891 5.25 17.2239 5.73835 17.5 6.5L19 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M2 13.5C2 12.6716 2.67157 12 3.5 12H20.5C21.3284 12 22 12.6716 22 13.5V17.5C22 18.3284 21.3284 19 20.5 19H3.5C2.67157 19 2 18.3284 2 17.5V13.5Z"
            stroke="currentColor"
            strokeWidth="2"
        />
        <circle cx="7" cy="15.5" r="1.5" fill="currentColor" />
        <circle cx="17" cy="15.5" r="1.5" fill="currentColor" />
        <path d="M2 13H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)


export const HomeIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M9 21V12H15V21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)


export const BriefcaseIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect
            x="2"
            y="7"
            width="20"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)


export const BathroomIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M4 12H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M4 12V6C4 4.89543 4.89543 4 6 4H6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
        <path d="M6 20V22M18 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)


export const WindowIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)


export const BedIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M2 12H22V17H2V12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M2 17V20M22 17V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
            d="M4 12V8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="7" cy="9" r="1.5" fill="currentColor" />
    </svg>
)


export const SprayIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect
            x="8"
            y="10"
            width="6"
            height="12"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M8 13H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
            d="M11 10V6C11 4.89543 11.8954 4 13 4H13.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <circle cx="13.5" cy="4" r="1" fill="currentColor" />
        <path d="M17 3V3.5M19 5H18.5M17 7V6.5M15 5H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 3V3.5M6 5H5.5M4 7V6.5M2 5H2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
)


export const BugIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <ellipse cx="12" cy="14" rx="5" ry="6" stroke="currentColor" strokeWidth="2" />
        <path
            d="M12 8C13.6569 8 15 6.65685 15 5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5C9 6.65685 10.3431 8 12 8Z"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path d="M7 11L4 9M17 11L20 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 15H3M17 15H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 18L4 20M17 18L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 14V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)


export const BoxIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M12 12L20 7.5M12 12L4 7.5M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)


export const HammerIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M14.5 3L21 9.5L11.5 19L5 12.5L14.5 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M14.5 3L10 7.5L3 5L5 3L14.5 3Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
    </svg>
)


export const BuildingIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <rect
            x="4"
            y="3"
            width="16"
            height="18"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M8 7H10M14 7H16M8 11H10M14 11H16M8 15H10M14 15H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 21V17H14V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)


export const SedanIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M5 13L6.5 8.5C6.77614 7.73835 7.51093 7.25 8.32558 7.25H15.6744C16.4891 7.25 17.2239 7.73835 17.5 8.5L19 13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M3 14.5C3 13.6716 3.67157 13 4.5 13H19.5C20.3284 13 21 13.6716 21 14.5V17C21 17.5523 20.5523 18 20 18H4C3.44772 18 3 17.5523 3 17V14.5Z"
            stroke="currentColor"
            strokeWidth="2"
        />
        <circle cx="7" cy="15.5" r="1.25" fill="currentColor" />
        <circle cx="17" cy="15.5" r="1.25" fill="currentColor" />
    </svg>
)


export const SUVIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M4 12L5.5 6.5C5.77614 5.73835 6.51093 5.25 7.32558 5.25H16.6744C17.4891 5.25 18.2239 5.73835 18.5 6.5L20 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M2 13.5C2 12.6716 2.67157 12 3.5 12H20.5C21.3284 12 22 12.6716 22 13.5V18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18V13.5Z"
            stroke="currentColor"
            strokeWidth="2"
        />
        <circle cx="6.5" cy="15.5" r="1.5" fill="currentColor" />
        <circle cx="17.5" cy="15.5" r="1.5" fill="currentColor" />
        <path d="M2 13H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)


export const TruckIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M2 8C2 6.89543 2.89543 6 4 6H13V16H2V8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M13 8H16L19 11V16H13V8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="6.5" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="16.5" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8.5 16H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
)


export const CheckIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
)


export const StarIcon = ({ className = '', size = 24 }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="currentColor"
        />
    </svg>
)
