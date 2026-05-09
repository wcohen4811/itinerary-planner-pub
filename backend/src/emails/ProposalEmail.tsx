import * as React from 'react';
import { Body, Column, Container, Head, Heading, Html, Img, Link, Preview, Row, Section, Text } from '@react-email/components';

export type ProposalEmailFlight = {
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  dateLabel?: string | null;
};

export type ProposalEmailDay = {
  dayLabel: string;
  title: string;
  description?: string | null;
  tags?: string[] | null;
};

export type ProposalEmailData = {
  logoUrl: string;
  companyName: string;
  preparedBy: string;
  heading: string;
  messageParagraphs: string[];
  airfareUsd: number;
  travelersCount: number;
  daysCount: number;
  nightsCount: number;
  accommodationLabel: string;
  inclusions: string[];
  exclusions: string[];
  flights: ProposalEmailFlight[];
  days: ProposalEmailDay[];
  pricing: {
    baseWithMarginUsd: number;
    pricingFeesUsd: number;
    airfareUsd: number;
    discountUsd?: number;
    totalAfterDiscountUsd?: number;
    finalTotalUsd: number;
    selectedPricingLabel: string;
  };
};

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
  whiteSpace: 'pre-wrap' as const,
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
  textTransform: 'uppercase' as const,
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
  textTransform: 'uppercase' as const,
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
  textAlign: 'center' as const,
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
  verticalAlign: 'top' as const,
  paddingRight: '8px',
  borderRight: '1px solid #f3f4f6',
};

const rightCol = {
  width: '35%',
  verticalAlign: 'top' as const,
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
  textTransform: 'uppercase' as const,
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
  textTransform: 'uppercase' as const,
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
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  fontSize: '11px',
  fontWeight: 800,
  padding: '12px 16px',
  borderRadius: '12px',
  textAlign: 'center' as const,
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

function formatUsd(value: number) {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `$${safe.toLocaleString('en-US')}`;
}

export function ProposalEmail({
  logoUrl,
  companyName,
  preparedBy,
  heading,
  messageParagraphs,
  airfareUsd,
  travelersCount,
  daysCount,
  nightsCount,
  accommodationLabel,
  inclusions,
  exclusions,
  flights,
  days,
  pricing,
}: ProposalEmailData) {
  return (
    <Html>
      <Head>
        <style>{`
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
        `}</style>
      </Head>
      <Preview>{heading}</Preview>
      <Body style={main}>
        <Container style={container} className="email-container">
          <Section style={headerRow}>
            <Row>
              <Column style={{ width: '56px' }}>
                <div style={logoWrap}>
                  <Img src={logoUrl} alt={`${companyName} logo`} width="48" height="48" style={{ display: 'block' }} />
                </div>
              </Column>
              <Column>
                <Heading as="h4" style={companyNameStyle}>
                  {companyName}
                </Heading>
                <Text style={preparedByStyle}>Prepared by {preparedBy}</Text>
              </Column>
            </Row>
          </Section>

          <Section>
            <Row style={layoutRow} className="stack-row">
              <Column style={leftCol} className="stack-col stack-left">
                <Section style={introSection}>
                  {messageParagraphs.length === 0 ? (
                    <Text style={messageText}> </Text>
                  ) : (
                    messageParagraphs.map((paragraphText, idx) => (
                      <Text
                        key={`${paragraphText}-${idx}`}
                        style={{
                          ...messageText,
                          marginBottom: idx === messageParagraphs.length - 1 ? '0' : '14px',
                        }}
                      >
                        {paragraphText}
                      </Text>
                    ))
                  )}
                </Section>

                <Section style={flightCard}>
                  <Text style={flightTitle}>Flight Itinerary • {formatUsd(airfareUsd)} Per Person</Text>
                  {flights.length === 0 ? (
                    <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>No flights formatted yet.</Text>
                  ) : (
                    flights.map((flight, idx) => (
                      <div key={`${flight.airlineCode}${flight.flightNumber}-${idx}`} style={idx < flights.length - 1 ? flightRow : undefined}>
                        <Row>
                          <Column>
                            <Text style={flightNumberStyle}>
                              {flight.airlineCode}
                              {flight.flightNumber}
                            </Text>
                            <Text style={flightRouteStyle}>
                              {flight.from} → {flight.to}
                            </Text>
                            <Text style={flightTimeStyle}>
                              {flight.dateLabel ? `${flight.dateLabel} • ` : ''}
                              {flight.depart} - {flight.arrive}
                            </Text>
                          </Column>
                          <Column align="right" style={{ width: '70px', verticalAlign: 'top' }}>
                            <div style={flightBadge}>—</div>
                          </Column>
                        </Row>
                      </div>
                    ))
                  )}
                </Section>

                <Section style={{ marginBottom: '24px' }}>
                  <Text style={sectionTitle}>Itinerary Highlights</Text>
                  {days.length === 0 ? (
                    <Text style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>Select a base itinerary to preview days.</Text>
                  ) : (
                    <div style={highlightWrap}>
                      {days.map((day, idx) => (
                        <div key={`${day.dayLabel}-${idx}`} style={highlightItem}>
                          <Text style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#2563eb' }}>{day.dayLabel}</Text>
                          {day.tags && day.tags.length > 0 ? (
                            <div style={{ margin: '6px 0 4px' }}>
                              {day.tags.map((tag, tagIdx) => (
                                <span key={`${tag}-${tagIdx}`} style={dayTag}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <Text style={dayTitle}>{day.title}</Text>
                          {day.description ? <Text style={dayDescription}>{day.description}</Text> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              </Column>

              <Column style={rightCol} className="stack-col stack-right">
                <div style={sidebarWrap} className="stack-sidebar">
                  <Row style={{ marginBottom: '12px' }}>
                    <Column>
                      <Text style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', margin: 0 }}>
                        {daysCount} Days / {nightsCount} Nights
                      </Text>
                    </Column>
                    <Column align="right">
                      <Text style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', margin: 0 }}>
                        {travelersCount || 1} Travelers
                      </Text>
                    </Column>
                  </Row>

                  <div style={{ marginBottom: '18px' }}>
                    <Text style={{ ...sidebarSectionTitle, margin: '0 0 12px' }}>What's Included</Text>
                    {(inclusions || []).map((item, idx) => (
                      <Row key={`${item}-${idx}`} style={{ marginBottom: '8px' }}>
                        <Column style={{ width: '16px' }}>
                          <Text style={{ fontSize: '12px', color: '#137fec', margin: 0 }}>•</Text>
                        </Column>
                        <Column>
                          <Text style={{ ...sidebarListItem, margin: 0 }}>{item}</Text>
                        </Column>
                      </Row>
                    ))}
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <Text style={{ ...sidebarSectionTitle, margin: '0 0 12px' }}>Not Included</Text>
                    {(exclusions || []).map((item, idx) => (
                      <Row key={`${item}-${idx}`} style={{ marginBottom: '8px' }}>
                        <Column style={{ width: '16px' }}>
                          <Text style={{ fontSize: '12px', color: '#137fec', margin: 0 }}>•</Text>
                        </Column>
                        <Column>
                          <Text style={{ ...sidebarListItem, margin: 0 }}>{item}</Text>
                        </Column>
                      </Row>
                    ))}
                  </div>

                  <Text style={sidebarNotice}>
                    Prices and availability are subject to change until deposit is received.
                  </Text>

                  <div style={{ marginBottom: '12px', ...sidebarCard }}>
                    <Text style={sidebarTitle}>Total Price</Text>
                    <Text style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px' }}>
                      Accommodation: {accommodationLabel || pricing.selectedPricingLabel}
                    </Text>
                    <Text style={{ ...sidebarRow, marginBottom: '6px' }}>
                      Base itinerary: <span style={sidebarRowValue}>{formatUsd(pricing.baseWithMarginUsd)}</span>
                    </Text>
                    <Text style={sidebarRow}>
                      Additional fees: <span style={sidebarRowValue}>{formatUsd(pricing.pricingFeesUsd)}</span>
                    </Text>
                    <Text style={sidebarRow}>
                      Airfare: <span style={sidebarRowValue}>{formatUsd(pricing.airfareUsd)}</span>
                    </Text>
                    <Text style={sidebarRow}>
                      Discount: <span style={sidebarRowValue}>- {formatUsd(pricing.discountUsd ?? 0)}</span>
                    </Text>
                    <Text style={{ ...sidebarRow, marginTop: '10px' }}>
                      Total after discount: <span style={sidebarRowValue}>{formatUsd(pricing.totalAfterDiscountUsd ?? pricing.finalTotalUsd)}</span>
                    </Text>
                    <Text style={{ fontSize: '12px', color: '#64748b', margin: '10px 0 0' }}>
                      Total price (per person): {formatUsd(pricing.finalTotalUsd)} pp
                    </Text>
                    <Text style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>
                      Total for {travelersCount || 1} Pax: {formatUsd(pricing.finalTotalUsd * (travelersCount || 1))}
                    </Text>
                  </div>

                  <Link href="https://savacations.com" style={sidebarButton}>
                    Reserve This Trip
                  </Link>
                  <Text style={{ fontSize: '11px', color: '#94a3b8', margin: '12px 0 0', textAlign: 'center' }}>
                    Proposal valid for 14 days
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

