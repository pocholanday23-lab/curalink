import { CuralinkLogo } from "@/components/curalink-logo";
import type { ContractData } from "@/lib/contract";
import { DEFAULT_SOW_TEXT } from "@/lib/contract-defaults";

const SIGNATORY_NAME = "Peter Pocholo Olanday";
const SIGNATORY_TITLE = "Director";

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function money(n: number): string {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td className="w-1/3 border border-black/20 bg-black/[0.03] px-3 py-2 align-top font-semibold">
        {label}
      </td>
      <td className="border border-black/20 px-3 py-2 align-top">
        {children}
      </td>
    </tr>
  );
}

export function ContractDocument({ data }: { data: ContractData }) {
  const {
    companyName,
    companyAddress,
    signatureUrl,
    contractorName,
    contractorAddress,
    endClientName,
    endClientAddress,
    agreementDate,
    engagementStart,
    engagementEnd,
    serviceFeePhp,
    sowNotes,
  } = data;

  const engagementPeriod = engagementEnd
    ? `From ${fmt(engagementStart)} to ${fmt(
        engagementEnd
      )}, unless earlier terminated under this Agreement`
    : `Starting ${fmt(
        engagementStart
      )}, continuing until earlier terminated under this Agreement`;

  // PHP only — the contract never states a USD figure.
  const serviceFee =
    serviceFeePhp != null
      ? `₱${money(serviceFeePhp)} per month, subject to the applicable Statement of Work`
      : "To be confirmed, subject to the applicable Statement of Work";

  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-sm leading-relaxed text-black sm:p-10 print:max-w-none print:p-0">
      <div className="mb-8 flex items-center justify-center gap-3">
        <CuralinkLogo className="h-10 w-10 text-black/70" />
        <span className="text-lg font-bold">{companyName}</span>
      </div>

      <h1 className="mb-6 text-center text-lg font-bold uppercase tracking-wide">
        Independent Contractor Agreement
      </h1>

      <p className="mb-4">
        This INDEPENDENT CONTRACTOR AGREEMENT (&ldquo;Agreement&rdquo;) is made
        and entered into as of {fmt(agreementDate)}, by and between:
      </p>
      <p className="mb-4">
        <strong>{companyName}</strong> (the &ldquo;Company&rdquo;), with its
        principal place of business located at{" "}
        {companyAddress ?? "the Company&rsquo;s registered address"},
      </p>
      <p className="mb-4">And</p>
      <p className="mb-6">
        <strong>{contractorName}</strong> (&ldquo;Independent
        Contractor&rdquo;), an individual with his/her principal place of
        business located at {contractorAddress ?? "the address on file"}.
      </p>

      <h2 className="mb-2 font-bold uppercase">Recitals</h2>
      <p className="mb-3">
        WHEREAS, {companyName} is engaged in providing business support and
        related services to clients, including the End Client identified in
        the applicable Statement of Work.
      </p>
      <p className="mb-3">
        WHEREAS, {companyName} wishes to engage the Independent Contractor as
        an independent service provider for specific services and
        deliverables,
      </p>
      <p className="mb-3">
        WHEREAS, the Independent Contractor represents that he/she has the
        skill, tools, equipment, resources, and independent capacity necessary
        to perform such services.
      </p>
      <p className="mb-6">
        WHEREAS, the Parties intend this Agreement to govern an independent
        contractor relationship. The Agreement shall be interpreted
        consistently with the Contractor&rsquo;s independent status and with
        the actual performance of the services.
      </p>

      <h2 className="mb-2 font-bold uppercase">Term Sheet</h2>
      <table className="mb-6 w-full border-collapse text-xs sm:text-sm">
        <tbody>
          <Row label="Company">{companyName}</Row>
          <Row label="Independent Contractor">
            {contractorName}
            {contractorAddress ? `, ${contractorAddress}` : ""}
          </Row>
          <Row label="End Client">
            {endClientName ?? "To be assigned"}
            {endClientAddress ? `, ${endClientAddress}` : ""}
          </Row>
          <Row label="Engagement Type">
            Independent Contractor Services Engagement
          </Row>
          <Row label="Engagement Period">{engagementPeriod}</Row>
          <Row label="Services / Deliverables">
            As stated in the applicable Statement of Work attached as Annex
            &ldquo;A&rdquo;, including the agreed service standards and key
            performance indicators.
          </Row>
          <Row label="Service Fee">{serviceFee}</Row>
          <Row label="Incentive / Commission">
            Governed by a separate Incentive &amp; Commission Agreement, if
            applicable. Not included in the base contract price above.
          </Row>
          <Row label="Payment Terms">
            Payable upon invoice or billing statement and acceptance of
            Services, unless otherwise stated in the Statement of Work.
          </Row>
          <Row label="Independent Contractor's Tools">
            Contractor shall provide his/her own equipment, tools, internet
            connection, workspace, and resources.
          </Row>
          <Row label="Governing Law">Philippines</Row>
        </tbody>
      </table>
      <p className="mb-8 text-xs italic">
        In case of conflict between this Term Sheet and the main body of this
        Agreement, the main body of this Agreement shall prevail, unless the
        Parties expressly state otherwise in writing.
      </p>

      <h2 className="mb-2 font-bold uppercase">Agreement</h2>
      <p className="mb-4">
        NOW, THEREFORE, for and in consideration of the premises and the
        mutual promises and agreements hereinafter set forth, Company and
        Independent Contractor agree as follows:
      </p>

      <p className="mb-2 font-semibold">1. Engagement.</p>
      <p className="mb-3">
        The Company hereby engages the services of Independent Contractor, and
        Independent Contractor agrees to provide, the services described
        further herein. The specific services, deliverables, timelines,
        service standards, fees, key performance indicators, payment terms,
        and other engagement-specific requirements shall be set out in a
        written Statement of Work attached as Annex &ldquo;A&rdquo;, which
        shall form an integral part of this Agreement once signed or approved
        by the parties. No Services shall be deemed authorized, and the
        Company shall not be liable to pay for any Services, unless such
        Services are covered by this Agreement and the applicable Statement of
        Work, or are otherwise expressly authorized in writing by the Company.
      </p>
      <p className="mb-3">
        The Independent Contractor shall perform only the services described
        in the applicable Statement of Work, and shall be responsible for
        completing and delivering the agreed Services or deliverables in
        accordance with it. The Company&rsquo;s review or acceptance of
        deliverables shall not be construed as control over the manner,
        method, sequence, or means by which the Independent Contractor
        performs the Services.
      </p>

      <p className="mb-2 font-semibold">2. Term and Termination.</p>
      <p className="mb-3">
        The term of this Agreement shall be as stated in the Engagement Period
        above (the &ldquo;Term&rdquo;), unless earlier terminated as provided
        herein, or unless extended by mutual agreement expressed in writing
        signed by both parties prior to the expiration of the Term.
        Notwithstanding anything in this Agreement to the contrary: (a) either
        party may terminate this Agreement immediately upon written notice if
        the other party commits a material breach of any obligation under
        this Agreement; and (b) either party may terminate this Agreement
        without cause by giving the other party at least seven (7)
        days&rsquo; prior written notice.
      </p>

      <p className="mb-2 font-semibold">3. Fees and Expenses; Services.</p>
      <p className="mb-3">
        In consideration of the Services performed under this Agreement and
        the applicable Statement of Work, the Company shall pay the
        Independent Contractor the service fee stated above. Unless otherwise
        stated in the Statement of Work, service fees shall be payable upon
        submission of the Independent Contractor&rsquo;s invoice or billing
        statement and upon the Company&rsquo;s acceptance of the completed
        Services or deliverables. The Independent Contractor shall provide,
        maintain, and be responsible for, at his/her own expense, all
        equipment, tools, devices, internet connection, software, workspace,
        and other resources necessary for the performance of the Services,
        and shall retain control over the manner, method, sequence, and means
        of performing the Services, subject only to the agreed deliverables,
        timelines, service standards, confidentiality obligations, data
        security requirements, and lawful coordination requirements stated in
        this Agreement or the applicable Statement of Work.
      </p>

      <p className="mb-2 font-semibold">
        4. Additional Requirements for Services to Be Performed.
      </p>
      <p className="mb-3">
        Independent Contractor shall provide reasonable progress updates as
        may be necessary to confirm the status of agreed deliverables,
        timelines, and service requirements, for coordination and acceptance
        purposes only and not as supervision or control over the manner and
        means of performing the Services. The Independent Contractor shall
        perform the Services with reasonable skill, care, diligence, and
        professionalism, consistent with the applicable Statement of Work, and
        shall not assign, delegate, or subcontract the Services, in whole or
        in part, without the Company&rsquo;s prior written consent.
      </p>

      <p className="mb-2 font-semibold">
        5. Work Product and Intellectual Property.
      </p>
      <p className="mb-3">
        All documents, reports, files, data, records, materials, outputs, work
        product, processes, content, deliverables, and other materials
        prepared, developed, produced, or submitted by the Independent
        Contractor in connection with the Services shall belong exclusively to
        the Company and/or the End Client, as applicable. To the fullest
        extent allowed by law, the Independent Contractor hereby assigns,
        transfers, and conveys to the Company all rights, title, and interest
        in and to such work product, including any applicable intellectual
        property rights, without need of further act or consideration.
      </p>

      <p className="mb-2 font-semibold">
        6. Independent Contractor Relationship.
      </p>
      <p className="mb-3">
        The Parties acknowledge and agree that the Contractor is engaged as an
        independent contractor and not as an employee, agent, partner, or
        representative of the Company or the End Client. The Contractor shall
        not be entitled to employee benefits provided by the Company to its
        employees, including paid leave, 13th month pay, health benefits, or
        other benefits arising from an employer-employee relationship, unless
        required by applicable law or separately agreed in writing. The
        Contractor shall be responsible for his/her own tax registration, tax
        filings, invoices or receipts, licenses, permits, and self-employed
        statutory contributions, subject to any applicable withholding tax
        obligations of the Company under existing laws and regulations. The
        Independent Contractor has no authority to represent, bind, negotiate
        for, incur obligations on behalf of, or make commitments for the
        Company or the End Client, unless expressly authorized in writing for
        a specific purpose.
      </p>

      <p className="mb-2 font-semibold">
        7. Conflicts of Interest and Ethical Conduct.
      </p>
      <p className="mb-3">
        The Independent Contractor shall avoid engagements that directly and
        materially conflict with the Services or create a substantial risk of
        unauthorized disclosure or misuse of Confidential Information, shall
        comply with all applicable laws and regulations, and agrees to refrain
        from any solicitation or recruitment (directly or indirectly) of any
        of Company&rsquo;s employees during the term of this Agreement and for
        a period after its expiration or termination equal in duration to the
        duration of this Agreement.
      </p>

      <p className="mb-2 font-semibold">
        8. Confidentiality and Non-Disclosure.
      </p>
      <p className="mb-3">
        Independent Contractor agrees, during the Term of this Agreement and
        thereafter, to hold in confidence and not to directly or indirectly
        reveal, report, publish, disclose or transfer any Confidential
        Information (as commonly understood to include trade secrets,
        marketing data and plans, customer lists, product and process
        information, and similar non-public information disclosed to the
        Contractor through the engagement) to any other person or entity, or
        utilize it for any purpose except in the course of Services performed
        under this Agreement. Upon expiration or termination of this
        Agreement, the Contractor shall immediately return, delete, or
        surrender all documents, files, records, access credentials, work
        product, and materials containing Confidential Information or
        belonging to the Company or the End Client.
      </p>

      <p className="mb-2 font-semibold">9. Representations and Warranties.</p>
      <p className="mb-3">
        Independent Contractor represents and warrants that he/she has full
        legal capacity and authority to enter into this Agreement, that doing
        so will not violate any obligation owed to a third party, that he/she
        has the skill, experience, equipment, and independent capacity to
        perform the Services, that the Services and work product will not
        infringe any third-party right, and that he/she shall be responsible
        for his/her own tax, registration, licensing, invoicing, and
        self-employed contribution obligations, subject to applicable law.
      </p>

      <p className="mb-2 font-semibold">10. Indemnity.</p>
      <p className="mb-3">
        The Independent Contractor shall indemnify and hold the Company, its
        officers, directors, representatives, affiliates, and clients free
        and harmless from and against claims, losses, damages, liabilities,
        penalties, costs, and expenses, including reasonable attorney&rsquo;s
        fees, arising from the Contractor&rsquo;s breach of this Agreement,
        negligence, fraud, bad faith, or willful misconduct, unauthorized
        disclosure or misuse of Confidential Information, infringement of
        third-party rights, or failure to comply with his/her own tax,
        licensing, or registration obligations.
      </p>

      <p className="mb-2 font-semibold">11. Non-Solicitation and Non-interference.</p>
      <p className="mb-3">
        During the term of this Agreement and for one year after its
        expiration or termination, the Contractor shall not directly solicit,
        divert, or attempt to solicit or divert any client, customer,
        contractor, employee, vendor, business relation, or end client of the
        Company or the End Client with whom the Contractor had material
        contact through the engagement, nor interfere with any contract or
        business relationship involving the Company or the End Client.
      </p>

      <p className="mb-2 font-semibold">12. Notices; 13. Force Majeure.</p>
      <p className="mb-3">
        Any notice under this Agreement shall be in writing and delivered
        personally, by courier, registered mail, or electronic mail. Neither
        Party shall be liable for delay or failure to perform any obligation
        under this Agreement, except payment obligations already due, caused
        by events beyond the reasonable control of the affected Party.
      </p>

      <p className="mb-2 font-semibold">14. Miscellaneous.</p>
      <p className="mb-3">
        This Agreement contains the entire agreement of the parties with
        respect to its subject matter and cannot be modified except in
        writing signed by the party against whom enforcement is sought. The
        provisions on confidentiality, data security, intellectual property,
        return of materials, indemnity, non-solicitation, non-interference,
        and governing law shall survive expiration or termination. This
        Agreement is not assignable by the Independent Contractor. The
        validity and effect of this Agreement shall be governed by and
        construed in accordance with the laws of the Philippines. The Parties
        shall first attempt in good faith to resolve any dispute; if
        unresolved, any action shall be filed exclusively before the proper
        courts of Makati City, Philippines, unless the Parties agree in
        writing to mediation or arbitration.
      </p>

      <p className="mb-10">
        IN WITNESS WHEREOF, the parties hereto have executed this Independent
        Contractor Agreement as of the date first above written.
      </p>

      <div className="mb-10 grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-semibold">COMPANY:</p>
          <div className="mt-6 flex h-14 items-end">
            {signatureUrl && (
              <img
                src={signatureUrl}
                alt={`${SIGNATORY_NAME}'s signature`}
                className="h-14 w-auto object-contain"
              />
            )}
          </div>
          <div className="border-t border-black/60 pt-1">
            <p>{SIGNATORY_NAME}</p>
            <p>{SIGNATORY_TITLE}</p>
            <p>{companyName}</p>
          </div>
        </div>
        <div>
          <p className="mb-1 font-semibold">INDEPENDENT CONTRACTOR:</p>
          <div className="mt-6 h-14" />
          <div className="border-t border-black/60 pt-1">
            <p>{contractorName}</p>
          </div>
        </div>
      </div>

      <div className="break-before-page whitespace-pre-line">
        <h2 className="mb-1 text-center text-xs font-semibold">Annex &ldquo;A&rdquo;</h2>
        <h1 className="mb-6 text-center text-lg font-bold uppercase">
          Statement of Work
        </h1>
        {sowNotes || DEFAULT_SOW_TEXT}
      </div>
    </div>
  );
}
