import { useState, useRef, useEffect } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Download, CheckCircle2, Image as ImageIcon, ArrowUp, Bot, MapPin, Clock, ExternalLink, CalendarCheck, Loader2, Navigation } from 'lucide-react';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { PreparedDocument, UserInfo } from '@/types/welfare';
import { supabase } from '@/integrations/supabase/client';

/* ── Office & appointment data per program ── */
interface OfficeInfo {
  name: string;
  address: string;
  officeHours: string;
  phone: string;
  onlineBookingUrl?: string;
  walkInNote?: string;
}

interface ProgramOfficeData {
  offices: OfficeInfo[];
  homeVisitNote?: string;
  postApprovalNote?: string;
}

const PROGRAM_OFFICE_DATA: Record<string, ProgramOfficeData> = {
  cssa: {
    offices: [
      {
        name: 'Social Security Field Unit (Kowloon)',
        address: '3/F, Cheung Sha Wan Government Offices, 303 Cheung Sha Wan Road, Sham Shui Po, Kowloon',
        officeHours: 'Mon–Fri 9:00 AM – 1:00 PM, 2:00 PM – 5:00 PM (Closed on Sat, Sun & Public Holidays)',
        phone: '2150 6281',
        onlineBookingUrl: 'https://www.gov.hk/en/residents/housing/socialhousing/applypha.htm',
      },
      {
        name: 'Social Security Field Unit (Hong Kong Island)',
        address: '11/F, Southorn Centre, 130 Hennessy Road, Wan Chai, Hong Kong',
        officeHours: 'Mon–Fri 9:00 AM – 1:00 PM, 2:00 PM – 5:00 PM (Closed on Sat, Sun & Public Holidays)',
        phone: '2835 1958',
      },
      {
        name: 'Social Security Field Unit (New Territories)',
        address: '4/F, Sha Tin Government Offices, 1 Sheung Wo Che Road, Sha Tin, NT',
        officeHours: 'Mon–Fri 9:00 AM – 1:00 PM, 2:00 PM – 5:00 PM (Closed on Sat, Sun & Public Holidays)',
        phone: '2158 6619',
      },
    ],
    homeVisitNote: 'After submitting your application, a Social Welfare Officer will contact you to schedule a home visit within 2–4 weeks. No online booking is available — the officer will call you directly.',
    postApprovalNote: 'After approval, you will receive a notification letter by post. Payment is made via direct deposit to your registered bank account on a monthly basis.',
  },
  oala: {
    offices: [
      {
        name: 'Social Security Field Unit (Central / Western)',
        address: '2/F, Harbour Building, 38 Pier Road, Central, Hong Kong',
        officeHours: 'Mon–Fri 9:00 AM – 1:00 PM, 2:00 PM – 5:00 PM',
        phone: '2852 3113',
        onlineBookingUrl: 'https://www.gov.hk/en/residents/housing/socialhousing/applypha.htm',
      },
      {
        name: 'Social Security Field Unit (Kwun Tong)',
        address: '5/F, Kwun Tong Government Offices, 12 Lei Yue Mun Road, Kwun Tong, Kowloon',
        officeHours: 'Mon–Fri 9:00 AM – 1:00 PM, 2:00 PM – 5:00 PM',
        phone: '2346 6413',
      },
      {
        name: 'Social Security Field Unit (Tuen Mun)',
        address: '3/F, Tuen Mun Government Offices, 1 Tuen Hi Road, Tuen Mun, NT',
        officeHours: 'Mon–Fri 9:00 AM – 1:00 PM, 2:00 PM – 5:00 PM',
        phone: '2618 7725',
      },
    ],
    homeVisitNote: 'For Normal Old Age Living Allowance, a home visit may be arranged at the officer\'s discretion. The officer will call you to schedule. Higher Old Age Living Allowance applicants are generally subject to a home visit within 2–3 weeks.',
    postApprovalNote: 'Upon approval, the allowance is paid monthly via autopay to your designated bank account. You will receive a written confirmation letter.',
  },
  'public-housing': {
    offices: [
      {
        name: 'Housing Authority Application Centre',
        address: 'G/F, Wang Tau Hom Estate Community Centre, 17 Lung Cheung Road, Wong Tai Sin, Kowloon',
        officeHours: 'Mon–Fri 9:00 AM – 12:30 PM, 1:30 PM – 5:00 PM',
        phone: '2712 2712',
        onlineBookingUrl: 'https://www.housingauthority.gov.hk/en/',
        walkInNote: 'Walk-in is accepted. Take a queue number at the entrance.',
      },
    ],
    postApprovalNote: 'You will be placed on the waiting list. When a unit becomes available, you will receive an allocation letter. Average wait: 5–6 years for general applicants.',
  },
  wfa: {
    offices: [
      {
        name: 'Working Family Allowance Office',
        address: '12/F, Trade and Industry Tower, 3 Concorde Road, Kowloon City, Kowloon',
        officeHours: 'Mon–Fri 9:00 AM – 12:45 PM, 2:00 PM – 5:45 PM; Sat 9:00 AM – 12:00 PM',
        phone: '2558 3588',
        onlineBookingUrl: 'https://www.wfsfaa.gov.hk/wfa/',
        walkInNote: 'Online application is preferred. Walk-in counter service available for enquiries only.',
      },
    ],
    postApprovalNote: 'If approved, the allowance will be deposited directly to your bank account. Processing time is approximately 8–12 weeks.',
  },
  'health-voucher': {
    offices: [
      {
        name: 'Elderly Health Care Voucher — Any Enrolled Healthcare Provider',
        address: 'No fixed office. Use your voucher at any enrolled doctor, dentist, or Chinese medicine practitioner.',
        officeHours: 'Varies by provider',
        phone: '2838 0511 (Health Care Voucher hotline)',
        onlineBookingUrl: 'https://www.hcv.gov.hk/en/',
      },
    ],
    postApprovalNote: 'Voucher credit is automatically loaded to your eHealth account once you turn 65. No separate application is needed if you already have an HKID.',
  },
};

interface RankedOffice {
  index: number;
  name: string;
  distance_km: number;
  distance_label: string;
  transport_suggestion: string;
}

const DocPrepChat = () => {
  const {
    docPrepSession, setDocPrepUserInfo, addPreparedDoc, advanceDocPrep,
    addTerminalLog, addChatMessage, clearDocPrep, updateProgramProgress,
  } = useWelfare();

  const [infoForm, setInfoForm] = useState<UserInfo>({ name: '', hkid: '', phone: '', address: '', email: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [bookingState, setBookingState] = useState<'idle' | 'booking' | 'booked'>('idle');
  const [zipDownloaded, setZipDownloaded] = useState(false);
  const [bookedOfficeName, setBookedOfficeName] = useState('');
  const [rankedOffices, setRankedOffices] = useState<RankedOffice[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const session = docPrepSession;

  // Fetch ranked offices when completed
  useEffect(() => {
    if (!session || !zipDownloaded) return;
    const officeData = PROGRAM_OFFICE_DATA[session.programId];
    if (!officeData || !session.userInfo.address || rankedOffices.length > 0 || isRanking) return;

    const fetchRanking = async () => {
      setIsRanking(true);
      addTerminalLog('[Office] Analyzing nearest offices via AI...');
      try {
        const { data, error } = await supabase.functions.invoke('deepseek-proxy', {
          body: {
            action: 'rank_offices',
            userAddress: session.userInfo.address,
            offices: officeData.offices.map(o => ({ name: o.name, address: o.address })),
          },
        });
        if (error) throw error;
        if (data?.ranked_offices?.length) {
          setRankedOffices(data.ranked_offices);
          addTerminalLog(`[Office] ✓ Ranked ${data.ranked_offices.length} offices by distance.`);
        }
      } catch (err) {
        addTerminalLog(`[Office] Ranking failed: ${err}`);
      } finally {
        setIsRanking(false);
      }
    };
    fetchRanking();
  }, [zipDownloaded, session?.programId, session?.userInfo.address]);

  if (!docPrepSession) return null;

  const { programId, programName, userName, docs, currentDocIndex, preparedDocs, status } = docPrepSession;
  const officeData = PROGRAM_OFFICE_DATA[programId];

  const handleInfoSubmit = () => {
    if (!infoForm.name.trim()) return;
    setDocPrepUserInfo(infoForm);
    addTerminalLog(`[DocPrep] User info submitted: ${infoForm.name}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || currentDocIndex >= docs.length) return;

    setIsGenerating(true);
    const docLabel = docs[currentDocIndex];
    addTerminalLog(`[DocPrep] Generating PDF for "${docLabel}"...`);

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const pdfBlob = await generatePDF(docLabel, userName, imageDataUrl);
      const safeDocLabel = docLabel.replace(/\//g, '-');
      const fileName = `${safeDocLabel} - ${userName}.pdf`;

      const prepDoc: PreparedDocument = { docLabel, fileName, pdfBlob, imageDataUrl };
      addPreparedDoc(prepDoc);
      // Auto-check the corresponding doc item in Journey panel
      updateProgramProgress(programId, `doc-${currentDocIndex}`);
      advanceDocPrep();
      addTerminalLog(`[DocPrep] ✓ "${fileName}" generated.`);
    } catch (err) {
      addTerminalLog(`[DocPrep] PDF generation failed: ${err}`);
    } finally {
      setIsGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generatePDF = async (docLabel: string, name: string, imageDataUrl: string): Promise<Blob> => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(14);
    pdf.setFont('times', 'bold');
    const title = `${docLabel} - ${name}`;
    pdf.text(title, pageWidth / 2, 25, { align: 'center' });

    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, 30, pageWidth - 20, 30);

    const img = new Image();
    img.src = imageDataUrl;
    await new Promise<void>((resolve) => { img.onload = () => resolve(); });

    const maxW = pageWidth - 40;
    const maxH = 220;
    let imgW = img.width;
    let imgH = img.height;
    const ratio = Math.min(maxW / imgW, maxH / imgH);
    imgW *= ratio;
    imgH *= ratio;

    const x = (pageWidth - imgW) / 2;
    pdf.addImage(imageDataUrl, 'JPEG', x, 36, imgW, imgH);

    pdf.setFontSize(8);
    pdf.setFont('times', 'normal');
    pdf.setTextColor(150);
    pdf.text(`Generated by BridgeCare - ${new Date().toLocaleDateString()}`, pageWidth / 2, 285, { align: 'center' });

    return pdf.output('blob');
  };

  const handleDownloadAll = async () => {
    if (preparedDocs.length === 0) return;
    addTerminalLog(`[DocPrep] Packaging ZIP...`);

    const zip = new JSZip();
    const folderName = `${programName} - ${userName} Application Documents`;

    preparedDocs.forEach(doc => {
      zip.file(doc.fileName, doc.pdfBlob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${folderName}.zip`);
    addTerminalLog(`[DocPrep] ✓ "${folderName}.zip" downloaded.`);
    setZipDownloaded(true);
  };

  const handleDownloadSingle = (doc: PreparedDocument) => {
    downloadBlob(doc.pdfBlob, doc.fileName);
    addTerminalLog(`[DocPrep] Downloaded: ${doc.fileName}`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFakeBooking = (officeName: string) => {
    setBookingState('booking');
    setBookedOfficeName(officeName);
    addTerminalLog(`[Booking] Submitting appointment request to ${officeName}...`);
    setTimeout(() => {
      setBookingState('booked');
      addTerminalLog(`[Booking] ✓ Appointment confirmed at ${officeName}.`);
      // Auto-check the first step item in Journey panel
      updateProgramProgress(programId, 'step-0');
    }, 2500);
  };

  return (
    <div className="rounded-2xl border bg-background shadow-sm overflow-hidden mx-6 mb-4">
      <div className="bg-primary/5 px-4 py-3 border-b flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Document Preparation - {programName}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Step 1: Collect all user info */}
        {status === 'asking_info' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Bot className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-sm text-foreground/90">
                Let's prepare your <strong>{programName}</strong> application documents. Please fill in all the required information below:
              </p>
            </div>
            <div className="grid gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name (English) *</label>
                <Input value={infoForm.name} onChange={e => setInfoForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chan Chi Keung" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">HKID Number</label>
                <Input value={infoForm.hkid} onChange={e => setInfoForm(p => ({ ...p, hkid: e.target.value }))} placeholder="e.g. A123456(7)" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
                <Input value={infoForm.phone} onChange={e => setInfoForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9123 4567" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Residential Address</label>
                <Input value={infoForm.address} onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Flat A, 12/F, Block 3, Mei Foo Sun Chuen" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Address</label>
                <Input value={infoForm.email} onChange={e => setInfoForm(p => ({ ...p, email: e.target.value }))} placeholder="e.g. chan@example.com" className="text-sm" />
              </div>
            </div>
            <Button size="sm" onClick={handleInfoSubmit} disabled={!infoForm.name.trim()} className="rounded-full px-6 w-full gap-2">
              <ArrowUp className="w-4 h-4" />
              Confirm & Start
            </Button>
          </div>
        )}

        {/* Step 2: Collecting docs one by one */}
        {status === 'collecting_docs' && currentDocIndex < docs.length && (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Bot className="w-4 h-4 text-primary mt-0.5" />
              <div className="text-sm text-foreground/90">
                <p>
                  Hi {userName}! Please upload document <strong>{currentDocIndex + 1}/{docs.length}</strong>:
                </p>
                <p className="mt-1 font-semibold text-primary">📄 {docs[currentDocIndex]}</p>
                <p className="text-xs text-muted-foreground mt-1">Upload a photo or scan of this document. A standard PDF will be generated automatically.</p>
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Button
              variant="outline" size="sm" className="rounded-full gap-2 w-full"
              onClick={() => fileInputRef.current?.click()} disabled={isGenerating}
            >
              {isGenerating ? <>Generating...</> : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload {docs[currentDocIndex]}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Prepared docs list */}
        {preparedDocs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated Documents</p>
            {preparedDocs.map((doc, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-accent/20">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs text-foreground flex-1 truncate">{doc.fileName}</span>
                <button onClick={() => handleDownloadSingle(doc)} className="text-xs text-primary hover:underline flex-shrink-0">
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: All done - download ZIP + Office info */}
        {status === 'completed' && preparedDocs.length > 0 && (
          <div className="space-y-4">
            {/* Download section */}
            <div className="space-y-3 border-b pb-4">
              <div className="flex items-start gap-2">
                <Bot className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-sm text-foreground/90">
                  🎉 All {preparedDocs.length} documents are ready! Download the complete package below.
                </p>
              </div>
              <Button size="sm" className="rounded-full gap-2 w-full" onClick={handleDownloadAll}>
                <Download className="w-4 h-4" />
                Download All — {programName} - {userName}.zip
              </Button>
            </div>

            {/* Office & appointment info */}
            {officeData && zipDownloaded && (
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-sm text-foreground/90">
                    📍 Here are the submission offices and next steps for your <strong>{programName}</strong> application:
                  </p>
                </div>

                {/* Loading ranking */}
                {isRanking && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-2 animate-pulse">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <p className="text-xs text-foreground/80">Finding nearest offices based on your address "{docPrepSession.userInfo.address}"...</p>
                  </div>
                )}

                {/* Offices list — sorted by distance if available */}
                {(() => {
                  const sortedOffices = rankedOffices.length > 0
                    ? rankedOffices.map(r => ({ ...officeData.offices[r.index], _ranked: r }))
                    : officeData.offices.map(o => ({ ...o, _ranked: null as RankedOffice | null }));

                  return sortedOffices.map((office, i) => (
                    <div key={i} className="rounded-xl border bg-accent/5 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          {office.name}
                        </p>
                        {office._ranked && (
                          <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <Navigation className="w-3 h-3" />
                            {office._ranked.distance_label}
                          </span>
                        )}
                      </div>
                      {i === 0 && office._ranked && (
                        <p className="text-xs font-medium text-primary ml-5">⭐ Nearest office to you</p>
                      )}
                      <div className="ml-5 space-y-1 text-xs text-foreground/80">
                        <p className="flex items-start gap-1.5">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          {office.address}
                        </p>
                        <p className="flex items-start gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          {office.officeHours}
                        </p>
                        <p>📞 Tel: {office.phone}</p>
                        {office._ranked?.transport_suggestion && (
                          <p className="flex items-start gap-1.5 text-primary/80">
                            🚇 {office._ranked.transport_suggestion}
                          </p>
                        )}
                        {office.walkInNote && (
                          <p className="text-muted-foreground italic">ℹ️ {office.walkInNote}</p>
                        )}
                      </div>

                      {/* Online booking URL + fake booking button */}
                      {office.onlineBookingUrl && (
                        <div className="ml-5 flex flex-col gap-1.5 mt-1">
                          <a
                            href={office.onlineBookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Online Portal: {office.onlineBookingUrl}
                          </a>
                          {bookingState === 'idle' && (
                            <Button
                              variant="outline" size="sm"
                              className="rounded-full gap-1.5 text-xs w-fit"
                              onClick={() => handleFakeBooking(office.name)}
                            >
                              <CalendarCheck className="w-3 h-3" />
                              Book Appointment Online
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ));
                })()}

                {/* Booking animation */}
                {bookingState === 'booking' && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 animate-pulse">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Booking appointment...</p>
                      <p className="text-xs text-muted-foreground">Connecting to {bookedOfficeName}</p>
                    </div>
                  </div>
                )}

                {bookingState === 'booked' && (
                  <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <p className="text-sm font-semibold text-foreground">Appointment Confirmed!</p>
                    </div>
                    <p className="text-xs text-foreground/80 ml-7">
                      Office: {bookedOfficeName}
                    </p>
                    <p className="text-xs text-foreground/80 ml-7">
                      Date: {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-foreground/80 ml-7">
                      Time: 10:00 AM
                    </p>
                    <p className="text-xs text-foreground/80 ml-7">
                      Applicant: {userName}
                    </p>
                    <p className="text-xs text-muted-foreground ml-7 mt-1 italic">
                      Please bring all prepared documents to the appointment.
                    </p>
                  </div>
                )}

                {/* Home visit note */}
                {officeData.homeVisitNote && (
                  <div className="rounded-xl border bg-accent/10 p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground">🏠 Home Visit / Social Worker Review</p>
                    <p className="text-xs text-foreground/80">{officeData.homeVisitNote}</p>
                  </div>
                )}

                {/* Post-approval note */}
                {officeData.postApprovalNote && (
                  <div className="rounded-xl border bg-accent/10 p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground">✅ After Approval</p>
                    <p className="text-xs text-foreground/80">{officeData.postApprovalNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {status === 'collecting_docs' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="w-3 h-3" />
            <span>Progress: {preparedDocs.length}/{docs.length} documents completed</span>
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(preparedDocs.length / docs.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocPrepChat;
