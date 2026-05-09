import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Body, Column, Container, Head, Heading, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components';
const main = {
    backgroundColor: '#e2e8f0',
    fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
    padding: '18px 0',
};
const container = {
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    padding: '18px',
    width: '100%',
    maxWidth: '1440px',
    border: '1px solid #e5e7eb',
};
const headerRow = {
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '20px',
    marginBottom: '20px',
};
const logoWrap = {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
};
const companyNameStyle = {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    lineHeight: '1.2',
};
const preparedByStyle = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '4px 0 0',
};
const h1 = {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 12px',
};
const paragraph = {
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#4b5563',
    margin: '0',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    whiteSpace: 'pre-wrap',
};
const messageText = {
    ...paragraph,
    margin: '0 0 14px',
};
const introSection = {
    marginBottom: '22px',
};
const sectionTitle = {
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#111827',
    margin: '0 0 10px',
};
const flightCard = {
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
};
const flightTitle = {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#2563eb',
    margin: '0 0 12px',
};
const flightRow = {
    borderBottom: '1px solid #dbeafe',
    paddingBottom: '10px',
    marginBottom: '10px',
};
const flightNumberStyle = {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
};
const flightRouteStyle = {
    fontSize: '13px',
    color: '#1f2937',
    margin: '2px 0 0',
};
const flightTimeStyle = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '2px 0 0',
};
const flightBadge = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    backgroundColor: '#ffffff',
    border: '1px solid #dbeafe',
    borderRadius: '6px',
    padding: '4px 8px',
    textAlign: 'center',
    minWidth: '48px',
};
const highlightWrap = {
    borderLeft: '2px solid #f1f5f9',
    paddingLeft: '16px',
    marginTop: '6px',
};
const layoutRow = {
    width: '100%',
};
const leftCol = {
    width: '65%',
    verticalAlign: 'top',
    paddingRight: '8px',
    borderRight: '1px solid #f3f4f6',
};
const rightCol = {
    width: '35%',
    verticalAlign: 'top',
    paddingLeft: '8px',
};
const sidebarWrap = {
    backgroundColor: '#f8fafc',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
};
const sidebarCard = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
};
const sidebarTitle = {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: '#94a3b8',
    margin: '0 0 4px',
};
const sidebarRow = {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 6px',
};
const sidebarRowValue = {
    fontWeight: 600,
    color: '#0f172a',
};
const sidebarListItem = {
    fontSize: '12px',
    color: '#475569',
    margin: '0 0 8px',
};
const sidebarSectionTitle = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: '#0f172a',
    margin: '0 0 12px',
};
const sidebarNotice = {
    fontSize: '11px',
    color: '#92400e',
    backgroundColor: '#fffbeb',
    border: '1px solid #fcd34d',
    borderRadius: '12px',
    padding: '10px',
    margin: '0 0 12px',
    lineHeight: '1.4',
};
const sidebarButton = {
    backgroundColor: '#137fec',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '11px',
    fontWeight: 800,
    padding: '12px 16px',
    borderRadius: '12px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'block',
};
const highlightItem = {
    paddingBottom: '18px',
};
const dayTag = {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 600,
    color: '#4b5563',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '9999px',
    marginRight: '6px',
    marginTop: '6px',
};
const dayTitle = {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
    margin: '4px 0 0',
};
const dayDescription = {
    fontSize: '12px',
    color: '#6b7280',
    margin: '4px 0 0',
};
const priceRow = {
    fontSize: '14px',
    color: '#4b5563',
};
const priceValue = {
    fontWeight: 600,
    color: '#111827',
};
const totalRow = {
    marginTop: '16px',
};
const totalValue = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#2563eb',
};
function formatUsd(value) {
    const safe = Number.isFinite(value) ? Math.round(value) : 0;
    return `$${safe.toLocaleString('en-US')}`;
}
export function ProposalEmail({ logoUrl, companyName, preparedBy, heading, messageParagraphs, airfareUsd, travelersCount, daysCount, nightsCount, accommodationLabel, inclusions, exclusions, flights, days, pricing, }) {
    return (_jsxs(Html, { children: [_jsx(Head, { children: _jsx("style", { children: `
          @media only screen and (max-width: 600px) {
            .email-container {
              max-width: 100% !important;
              padding: 12px !important;
            }
            .stack-row {
              display: block !important;
              width: 100% !important;
            }
            .stack-col {
              display: block !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .stack-left {
              padding-right: 0 !important;
              border-right: 0 !important;
            }
            .stack-right {
              padding-left: 0 !important;
            }
            .stack-sidebar {
              margin-top: 16px !important;
            }
          }
        ` }) }), _jsx(Preview, { children: heading }), _jsx(Body, { style: main, children: _jsxs(Container, { style: container, className: "email-container", children: [_jsx(Section, { style: headerRow, children: _jsxs(Row, { children: [_jsx(Column, { style: { width: '56px' }, children: _jsx("div", { style: logoWrap, children: _jsx(Img, { src: logoUrl, alt: `${companyName} logo`, width: "48", height: "48", style: { display: 'block' } }) }) }), _jsxs(Column, { children: [_jsx(Heading, { as: "h4", style: companyNameStyle, children: companyName }), _jsxs(Text, { style: preparedByStyle, children: ["Prepared by ", preparedBy] })] })] }) }), _jsx(Section, { children: _jsxs(Row, { style: layoutRow, className: "stack-row", children: [_jsxs(Column, { style: leftCol, className: "stack-col stack-left", children: [_jsx(Section, { style: introSection, children: messageParagraphs.length === 0 ? (_jsx(Text, { style: messageText, children: " " })) : (messageParagraphs.map((paragraphText, idx) => (_jsx(Text, { style: {
                                                        ...messageText,
                                                        marginBottom: idx === messageParagraphs.length - 1 ? '0' : '14px',
                                                    }, children: paragraphText }, `${paragraphText}-${idx}`)))) }), _jsxs(Section, { style: flightCard, children: [_jsxs(Text, { style: flightTitle, children: ["Flight Itinerary \u2022 ", formatUsd(airfareUsd), " Per Person"] }), flights.length === 0 ? (_jsx(Text, { style: { fontSize: '12px', color: '#6b7280', margin: '0' }, children: "No flights formatted yet." })) : (flights.map((flight, idx) => (_jsx("div", { style: idx < flights.length - 1 ? flightRow : undefined, children: _jsxs(Row, { children: [_jsxs(Column, { children: [_jsxs(Text, { style: flightNumberStyle, children: [flight.airlineCode, flight.flightNumber] }), _jsxs(Text, { style: flightRouteStyle, children: [flight.from, " \u2192 ", flight.to] }), _jsxs(Text, { style: flightTimeStyle, children: [flight.dateLabel ? `${flight.dateLabel} • ` : '', flight.depart, " - ", flight.arrive] })] }), _jsx(Column, { align: "right", style: { width: '70px', verticalAlign: 'top' }, children: _jsx("div", { style: flightBadge, children: "\u2014" }) })] }) }, `${flight.airlineCode}${flight.flightNumber}-${idx}`))))] }), _jsxs(Section, { style: { marginBottom: '24px' }, children: [_jsx(Text, { style: sectionTitle, children: "Itinerary Highlights" }), days.length === 0 ? (_jsx(Text, { style: { fontSize: '12px', color: '#6b7280', margin: '0' }, children: "Select a base itinerary to preview days." })) : (_jsx("div", { style: highlightWrap, children: days.map((day, idx) => (_jsxs("div", { style: highlightItem, children: [_jsx(Text, { style: { margin: 0, fontSize: '12px', fontWeight: 700, color: '#2563eb' }, children: day.dayLabel }), day.tags && day.tags.length > 0 ? (_jsx("div", { style: { margin: '6px 0 4px' }, children: day.tags.map((tag, tagIdx) => (_jsx("span", { style: dayTag, children: tag }, `${tag}-${tagIdx}`))) })) : null, _jsx(Text, { style: dayTitle, children: day.title }), day.description ? _jsx(Text, { style: dayDescription, children: day.description }) : null] }, `${day.dayLabel}-${idx}`))) }))] })] }), _jsx(Column, { style: rightCol, className: "stack-col stack-right", children: _jsxs("div", { style: sidebarWrap, className: "stack-sidebar", children: [_jsxs(Row, { style: { marginBottom: '12px' }, children: [_jsx(Column, { children: _jsxs(Text, { style: { fontSize: '12px', fontWeight: 600, color: '#64748b', margin: 0 }, children: [daysCount, " Days / ", nightsCount, " Nights"] }) }), _jsx(Column, { align: "right", children: _jsxs(Text, { style: { fontSize: '12px', fontWeight: 600, color: '#64748b', margin: 0 }, children: [travelersCount || 1, " Travelers"] }) })] }), _jsxs("div", { style: { marginBottom: '18px' }, children: [_jsx(Text, { style: { ...sidebarSectionTitle, margin: '0 0 12px' }, children: "What's Included" }), (inclusions || []).map((item, idx) => (_jsxs(Row, { style: { marginBottom: '8px' }, children: [_jsx(Column, { style: { width: '16px' }, children: _jsx(Text, { style: { fontSize: '12px', color: '#137fec', margin: 0 }, children: "\u2022" }) }), _jsx(Column, { children: _jsx(Text, { style: { ...sidebarListItem, margin: 0 }, children: item }) })] }, `${item}-${idx}`)))] }), _jsxs("div", { style: { marginBottom: '18px' }, children: [_jsx(Text, { style: { ...sidebarSectionTitle, margin: '0 0 12px' }, children: "Not Included" }), (exclusions || []).map((item, idx) => (_jsxs(Row, { style: { marginBottom: '8px' }, children: [_jsx(Column, { style: { width: '16px' }, children: _jsx(Text, { style: { fontSize: '12px', color: '#137fec', margin: 0 }, children: "\u2022" }) }), _jsx(Column, { children: _jsx(Text, { style: { ...sidebarListItem, margin: 0 }, children: item }) })] }, `${item}-${idx}`)))] }), _jsx(Text, { style: sidebarNotice, children: "Prices and availability are subject to change until deposit is received." }), _jsxs("div", { style: { marginBottom: '12px', ...sidebarCard }, children: [_jsx(Text, { style: sidebarTitle, children: "Total Price" }), _jsxs(Text, { style: { fontSize: '12px', color: '#94a3b8', margin: '0 0 10px' }, children: ["Accommodation: ", accommodationLabel || pricing.selectedPricingLabel] }), _jsxs(Text, { style: { ...sidebarRow, marginBottom: '6px' }, children: ["Base itinerary: ", _jsx("span", { style: sidebarRowValue, children: formatUsd(pricing.baseWithMarginUsd) })] }), _jsxs(Text, { style: sidebarRow, children: ["Additional fees: ", _jsx("span", { style: sidebarRowValue, children: formatUsd(pricing.pricingFeesUsd) })] }), _jsxs(Text, { style: sidebarRow, children: ["Airfare: ", _jsx("span", { style: sidebarRowValue, children: formatUsd(pricing.airfareUsd) })] }), _jsxs(Text, { style: sidebarRow, children: ["Discount: ", _jsxs("span", { style: sidebarRowValue, children: ["- ", formatUsd(pricing.discountUsd ?? 0)] })] }), _jsxs(Text, { style: { ...sidebarRow, marginTop: '10px' }, children: ["Total after discount: ", _jsx("span", { style: sidebarRowValue, children: formatUsd(pricing.totalAfterDiscountUsd ?? pricing.finalTotalUsd) })] }), _jsxs(Text, { style: { fontSize: '12px', color: '#64748b', margin: '10px 0 0' }, children: ["Total price (per person): ", formatUsd(pricing.finalTotalUsd), " pp"] }), _jsxs(Text, { style: { fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }, children: ["Total for ", travelersCount || 1, " Pax: ", formatUsd(pricing.finalTotalUsd * (travelersCount || 1))] })] }), _jsx(Link, { href: "https://savacations.com", style: sidebarButton, children: "Reserve This Trip" }), _jsx(Text, { style: { fontSize: '11px', color: '#94a3b8', margin: '12px 0 0', textAlign: 'center' }, children: "Proposal valid for 14 days" })] }) })] }) })] }) })] }));
}
