import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="none"/>
            <w:right w:val="none"/>
            <w:insideV w:val="none"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def build_paper():
    doc = docx.Document()

    # Page Margins (IEEE standard 0.75 in / 1.0 in)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Base Normal Style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("TreeConnect: An Integrated Digital Ecosystem for Agroforestry Management, Dynamic Timber Valuation, and Transparent Multi-Stakeholder Harvest Operations")
    run_title.font.name = 'Times New Roman'
    run_title.font.size = Pt(18)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)

    # Author
    p_author = doc.add_paragraph()
    p_author.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_author.paragraph_format.space_before = Pt(2)
    p_author.paragraph_format.space_after = Pt(14)

    r_name = p_author.add_run("Harigovind D Nair\n")
    r_name.font.bold = True
    r_name.font.size = Pt(11)

    r_dept = p_author.add_run("Department of Computer Applications\nAmal Jyothi College of Engineering\nKerala, India\n")
    r_dept.font.italic = True
    r_dept.font.size = Pt(9.5)

    r_email = p_author.add_run("Email: harigovinddnair@gmail.com")
    r_email.font.size = Pt(9.5)
    r_email.font.color.rgb = RGBColor(70, 70, 70)

    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(8)
    p_div_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr>')
    p_div._p.get_or_add_pPr().append(p_div_border)

    # Abstract Paragraph
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.space_after = Pt(4)
    r_abs_label = p_abs.add_run("Abstract—")
    r_abs_label.bold = True
    r_abs_label.italic = True
    
    r_abs_text = p_abs.add_run(
        "Conventional timber trading and harvest management in private agroforestry and farm forestry rely heavily "
        "on informal intermediary networks, unstandardized wood measurement conventions, opaque price discovery mechanisms, "
        "and fragmented logistics. While traditional practices allow local transactions to occur, they often result in information "
        "asymmetry, undervaluation of standing timber for landowners, delayed mobilization and payment risks for harvesting contractors, "
        "and an untraceable supply chain for industrial wood buyers. Digital platforms and computational frameworks provide significant "
        "potential to modernize these decentralized timber supply chains.\n"
        "This paper presents TreeConnect, an integrated, multi-stakeholder digital framework designed to unify geo-spatial tree "
        "inventory management, automated volumetric and market valuation, structured harvest operations workflows, milestone-based digital "
        "agreements with escrow payments, and a transparent timber marketplace. The proposed framework maintains persistent property- and "
        "tree-level records—including species, dendrometric attributes, health classifications, and geographic coordinates—and propagates "
        "these signals through a finite-state harvest lifecycle. To bridge the gap between field assessments and commercial settlement, "
        "TreeConnect incorporates an inspection assessment engine, dynamic price indexing based on regional forestry market schedules, "
        "and a multi-tiered payment disbursement protocol.\n"
        "The paper details the conceptual architecture, operational workflow, algorithmic valuation models, contractor inspection mechanics, "
        "research methodology, and evaluation framework of the proposed system. Rather than presuming operational efficiency prior to field "
        "deployment, this study defines quantitative and qualitative criteria to evaluate inventory valuation accuracy, contractor assessment "
        "adaptation, quotation precision, milestone fulfillment, and transactional transparency. The proposed architecture establishes a "
        "rigorous baseline for investigating how multi-sided digital platforms can improve efficiency, equity, and sustainability across "
        "decentralized wood supply chains."
    )
    r_abs_text.font.size = Pt(9.5)

    # Index Terms
    p_terms = doc.add_paragraph()
    p_terms.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_terms.paragraph_format.space_after = Pt(12)
    r_terms_label = p_terms.add_run("Index Terms—")
    r_terms_label.bold = True
    r_terms_label.italic = True
    r_terms = p_terms.add_run("adaptive operations, agroforestry supply chain, timber valuation, digital agriculture, harvest management, multi-stakeholder platform, escrow milestone settlement, forestry informatics, chain-of-custody.")
    r_terms.font.size = Pt(9.5)
    r_terms.italic = True

    def add_sec_heading(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(title)
        run.bold = True
        run.font.size = Pt(11)
        run.font.name = 'Times New Roman'
        return p

    def add_subsec_heading(title):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(title)
        run.bold = True
        run.italic = True
        run.font.size = Pt(10)
        run.font.name = 'Times New Roman'
        return p

    def add_body(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.size = Pt(10)
        run.font.name = 'Times New Roman'
        return p

    def add_equation(text, eq_num):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        run_eq = p.add_run(text)
        run_eq.italic = True
        run_eq.font.size = Pt(10.5)
        # Right aligned number
        run_num = p.add_run(f"       ({eq_num})")
        run_num.italic = False
        run_num.bold = True
        return p

    # I. INTRODUCTION
    add_sec_heading("I. INTRODUCTION")
    add_body(
        "Agroforestry and farm-grown trees on non-forest private lands represent an essential source of timber, industrial wood, and rural "
        "livelihoods across developing and agrarian economies [1], [2]. Unlike state-administered forest concessions that operate under centralized "
        "management regimes, farm timber is grown across dispersed, heterogeneous private landholdings. Despite the substantial volume of timber yielded "
        "by private farmlands—including commercially valuable species such as Teak (Tectona grandis), Mahogany (Swietenia macrophylla), Rosewood "
        "(Dalbergia latifolia), and Rubberwood (Hevea brasiliensis)—the marketing, harvesting, and logistical workflows associated with this sector "
        "remain overwhelmingly unorganized and decentralized."
    )
    add_body(
        "Smallholder landowners often lack the specialized technical expertise required to accurately estimate merchantable wood volume (e.g., distinguishing "
        "total stem biomass from commercial log volume using breast-height girth and clean bole height) or to verify current prevailing market rates [3]. "
        "Consequently, landowners depend heavily on itinerant middlemen or commission agents who conduct subjective visual appraisals. This arrangement creates "
        "severe informational asymmetry and price distortions, where landowners receive a small fraction of the wood's industrial terminal value while bearing "
        "lengthy biological production cycles."
    )
    add_body(
        "Conversely, timber felling contractors face operational friction, including unverified land titles, uncertain site access, poorly defined extraction routes, "
        "equipment allocation challenges, and protracted payment disputes with property owners [4], [5]. Furthermore, downstream wood consumers—such as sawmills, "
        "furniture manufacturers, and plywood processing plants—experience raw-material procurement bottlenecks, lack of verifiable chain-of-custody documentation, "
        "and regulatory delays related to statutory forest transit permits [6]."
    )
    add_body(
        "Digital informatics, geospatial mapping, and automated transaction protocols present an unprecedented opportunity to address these systemic inefficiencies. "
        "Research in agricultural informatics has demonstrated the efficacy of digital platforms in reducing transaction costs, establishing fair market access, and "
        "disintermediating supply chains [7], [8]. However, direct translation of general agricultural commodity platforms to timber is constrained by unique forestry "
        "characteristics: standing trees represent irregular, capital-intensive biological assets that require non-destructive dendrometric volume modeling, on-site "
        "physical risk assessment, specialized harvesting machinery, skilled labor allocation, and rigorous milestone tracking."
    )
    add_body(
        "Existing digital forestry initiatives have primarily focused on isolated domains: satellite remote sensing for canopy monitoring, standalone allometric "
        "volume calculators, or localized electronic classifieds [9], [10]. There remains a distinct lack of a unified digital ecosystem that connects tree inventory "
        "registration, contractor field inspections, dynamic price calculation, bilateral quotation negotiations, digital mobilization agreements, and end-to-end "
        "timber marketplace fulfillment within a single, continuous feedback cycle."
    )
    add_body(
        "The central motivation of this research is therefore to investigate how tree modeling, dynamic market rate indexing, state-machine-driven harvest operations, "
        "and milestone-secured financial clearing can operate as a cohesive socio-technical framework. This paper proposes TreeConnect, an integrated multi-stakeholder "
        "platform engineered around this integration."
    )
    add_body("The primary contributions of the proposed research are:")
    
    p_c1 = doc.add_paragraph()
    p_c1.paragraph_format.left_indent = Inches(0.25)
    p_c1.paragraph_format.space_after = Pt(2)
    p_c1.add_run("1) A unified multi-stakeholder architecture ").bold = True
    p_c1.add_run("connecting landowners, felling contractors, timber buyers, and platform administrators into a synchronized operational pipeline.")

    p_c2 = doc.add_paragraph()
    p_c2.paragraph_format.left_indent = Inches(0.25)
    p_c2.paragraph_format.space_after = Pt(2)
    p_c2.add_run("2) A dendrometric tree and property modeling formulation ").bold = True
    p_c2.add_run("that converts localized measurements (DBH, height, commercial species, parcel location) into standardized volumetric and valuation estimates.")

    p_c3 = doc.add_paragraph()
    p_c3.paragraph_format.left_indent = Inches(0.25)
    p_c3.paragraph_format.space_after = Pt(2)
    p_c3.add_run("3) A finite-state machine (FSM) harvest execution workflow ").bold = True
    p_c3.add_run("governing property inspection scheduling, structured commercial quotations, counter-negotiations, digital agreements, and milestone-driven advance payments.")

    p_c4 = doc.add_paragraph()
    p_c4.paragraph_format.left_indent = Inches(0.25)
    p_c4.paragraph_format.space_after = Pt(6)
    p_c4.add_run("4) An empirical evaluation framework ").bold = True
    p_c4.add_run("establishing formal criteria for evaluating volumetric accuracy, quotation responsiveness, contractor scheduling efficiency, payment risk mitigation, and socio-economic equity.")

    # II. BACKGROUND
    add_sec_heading("II. BACKGROUND")
    add_subsec_heading("A. Agroforestry Supply Chain Dynamics")
    add_body(
        "Agroforestry supply chains encompass all activities from seedling cultivation and silvicultural management to tree felling, debarking, yard extraction, "
        "log cross-cutting, transit permitting, transportation, and industrial conversion [1], [4]. In decentralized non-forest timber systems, inefficiencies "
        "arise primarily from transaction costs, transportation overheads, and informational deficits during the pre-harvest and harvesting phases."
    )

    add_subsec_heading("B. Tree Inventory and Volume Estimation")
    add_body(
        "Standardized estimation of standing timber volume is essential for equitable commercial transactions. In forestry, merchantable timber volume is commonly "
        "computed using allometric models, geometric solids (cylinder, paraboloid, or frustum of a cone), or the traditional quarter-girth (Hoppus) formula [11]. "
        "For TreeConnect, an individual standing tree T_i registered within an agroforestry parcel is represented conceptually as:"
    )
    add_equation("T_i = {S_i, G_i, H_i, V_i, Q_i, L_i, C_i}", "1")
    add_body(
        "where S_i denotes the botanical and commercial species classification (e.g., Teak, Rosewood, Rubberwood, Mahogany), G_i represents the girth at breast "
        "height (GBH, measured at 1.37 m above ground), H_i represents the merchantable clear bole height, V_i represents the computed commercial volume (m^3), "
        "Q_i denotes the visual timber grade and biological health index, L_i represents the geospatial coordinates (latitude, longitude) and terrain classification, "
        "and C_i represents digital verification media (timestamped, geo-tagged photography)."
    )

    add_subsec_heading("C. Multi-Stakeholder Coordination & Felling Economics")
    add_body(
        "Felling operations represent a complex commercial undertaking rather than a simple service call. Contractors must account for equipment logistics "
        "(chainsaws, mobile winches, extraction tractors, transport lorries), labor crew overheads, site hazards (proximity to dwellings, power lines, boundary fences), "
        "and statutory regulatory clearances (tree felling and transit permits under regional preservation acts) [12]. A digital coordination platform must therefore "
        "support multi-option commercial proposals: pure harvesting service contracts, direct standing-timber purchase offers, or hybrid arrangements."
    )

    add_subsec_heading("D. Dynamic Market Rate Indexing and Valuation")
    add_body(
        "Unlike exchange-traded agricultural commodities, standing timber value is sensitive to localized market demand, mill proximity, transport distances, "
        "log diameter classes, and species scarcity. A simplified timber market rate lookup can be formulated as:"
    )
    add_equation("R_s = M(S, D, t)", "2")
    add_body(
        "where S is the species, D is the administrative district or market jurisdiction, and t represents the effective market price epoch based on statutory "
        "forestry department market schedules. The gross estimated standing tree value V_e is subsequently computed by:"
    )
    add_equation("V_e = SUM_{i=1}^m [ V_i * R_s(S_i) * eta(Q_i) ]", "3")
    add_body(
        "where eta(Q_i) in (0, 1] represents the timber quality and accessibility discount coefficient, accounting for taper defects, branch knot density, "
        "and extraction topography."
    )

    # III. RELATED WORK
    add_sec_heading("III. RELATED WORK")
    add_body(
        "Digital transformation in forestry has advanced rapidly over the past decade, driven by advances in mobile computing, remote sensing, and supply chain "
        "management systems.\n"
        "Grebner et al. [2] and Bettinger et al. [3] examined forest resource management models, emphasizing how accurate forest inventory and spatial data "
        "infrastructures are vital for sustainable timber yield and commercial viability. However, their analyses focused primarily on industrial concessions "
        "and public forest regimes, leaving private smallholders unaddressed.\n"
        "Choudhry et al. [4] investigated timber harvesting logistics and the economics of wood extraction in small-scale forestry, demonstrating that uncoordinated "
        "harvesting operations increase transportation overheads and lower grower returns. Their study highlighted the need for synchronized equipment scheduling "
        "and localized contractor deployment.\n"
        "In the domain of commodity market digitization, Deichmann et al. [7] and Fabregas et al. [8] showed that mobile-enabled agricultural market platforms "
        "systematically reduce information asymmetry, eliminate price exploitation by intermediaries, and improve producer incomes. Nonetheless, standard agri-tech "
        "architectures designed for perishable seasonal crops fail to handle the complex volumetric, legal, and operational characteristics of perennial timber assets.\n"
        "Dykstra and Heinrich [11] reviewed global reduced-impact logging practices and volume measurement standards, establishing that rigorous pre-harvest assessment, "
        "tree tagging, and structured operational planning reduce wood wastage during felling and extraction.\n"
        "Smart contracts and digital milestone-based payments have also gained prominence in agricultural supply chains. Kshetri [13] reviewed blockchain and escrow "
        "mechanisms in supply chains, identifying transparency, auditability, and counterparty risk reduction as fundamental advantages for rural enterprises.\n"
        "While these research vectors provide valuable individual insights, existing literature indicates a clear absence of an end-to-end framework that unifies "
        "tree inventory tracking, mobile field assessment, dynamic price modeling, multi-party bidding, and milestone-governed payment settlement within a single operational platform."
    )

    # IV. RESEARCH GAP
    add_sec_heading("IV. RESEARCH GAP")
    add_body(
        "A critical synthesis of current academic literature and industrial forestry systems reveals five key limitations:\n"
        "First, existing platforms treat tree mapping, harvest logistics, and timber sales as independent, disconnected tools, forcing participants to revert "
        "to informal channels for operational transitions.\n"
        "Second, contractor assessments are typically recorded on paper or through unstandardized phone discussions, leaving landowners unable to systematically "
        "evaluate felling costs, extraction overheads, or safety assessments.\n"
        "Third, private tree owners have negligible access to official forestry department timber schedules or real-time mill gate prices, perpetuating economic "
        "exploitation by local brokers.\n"
        "Fourth, contractors face non-payment or cancellation after mobilizing costly machinery and labor to remote parcels, while landowners face property damage "
        "or abandonment by unqualified contractors.\n"
        "Fifth, wood processors and sawmills cannot verify the legal origin, species authenticity, or sustainable sourcing of private farm timber.\n"
        "The research gap addressed by TreeConnect can therefore be formulated as the need for an integrated digital ecosystem in which:\n"
        "1) Landowner tree inventories are digitally cataloged and verified;\n"
        "2) Harvest operations follow a formal, state-machine-governed execution cycle;\n"
        "3) Contractor inspections produce structured, auditable commercial proposals;\n"
        "4) Milestone agreements and digital escrow mechanisms eliminate counterparty financial risks; and\n"
        "5) Harvested timber transitions seamlessly into a transparent, competitive commercial marketplace."
    )

    # V. PROPOSED TREECONNECT FRAMEWORK
    add_sec_heading("V. PROPOSED TREECONNECT FRAMEWORK")
    add_body(
        "TreeConnect is proposed as an integrated agroforestry management and timber supply chain framework rather than a collection of independent tools. "
        "The framework contains five principal components:\n"
        "1) Geo-Spatial Property & Tree Inventory Engine\n"
        "2) Finite-State Harvest Operations & Inspection Engine\n"
        "3) Dynamic Timber Valuation & Commercial Proposal Engine\n"
        "4) Milestone-Based Digital Agreement & Escrow Payment Clearinghouse\n"
        "5) Timber Marketplace & Traceability Engine\n"
        "These components form a continuous operational cycle. Property and tree registrations generate the initial asset base, which triggers harvest requests; "
        "contractor inspections update operational parameters and commercial terms; ratified agreements lock milestone escrow deposits; and completed operations "
        "transfer verified timber into the commercial marketplace."
    )

    # TABLE I
    p_t1 = doc.add_paragraph()
    p_t1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t1.paragraph_format.space_before = Pt(8)
    p_t1.paragraph_format.space_after = Pt(4)
    r_t1 = p_t1.add_run("TABLE I\nFUNCTIONAL COMPONENTS OF TREECONNECT")
    r_t1.bold = True
    r_t1.font.size = Pt(9.5)

    table1 = doc.add_table(rows=6, cols=2)
    table1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table1)

    t1_headers = ["Component", "Primary Function"]
    for i, h in enumerate(t1_headers):
        cell = table1.cell(0, i)
        cell.text = h
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(9)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT

    t1_data = [
        ("Property & Inventory Engine", "Maintains geo-tagged property parcels, tree species categorization, dendrometric measures (GBH, height), and visual health status."),
        ("Harvest Operations Engine", "Enforces a deterministic finite-state machine (FSM) governing request submission, contractor assignment, inspection scheduling, and harvest execution."),
        ("Valuation & Proposal Engine", "Automatically computes timber volume, cross-references government/market rate tables, and generates itemized commercial felling and purchasing quotations."),
        ("Milestone & Escrow Subsystem", "Automates advance mobilization payments, interim felling milestones, and final disbursement via secure payment gateway webhooks."),
        ("Timber Marketplace Engine", "Enables transparent listing, specification filtering, volumetric bidding, and purchase order tracking for industrial wood buyers.")
    ]

    for row_idx, (comp, desc) in enumerate(t1_data, start=1):
        c0 = table1.cell(row_idx, 0)
        c1 = table1.cell(row_idx, 1)
        c0.text = comp
        c1.text = desc
        set_cell_margins(c0, top=100, bottom=100, left=150, right=150)
        set_cell_margins(c1, top=100, bottom=100, left=150, right=150)
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(9)
        c1.paragraphs[0].runs[0].font.size = Pt(9)
        if row_idx % 2 == 1:
            set_cell_background(c0, "FAFAFA")
            set_cell_background(c1, "FAFAFA")

    # VI. SYSTEM ARCHITECTURE
    add_sec_heading("VI. SYSTEM ARCHITECTURE")
    add_body(
        "The conceptual architecture of TreeConnect is organized into four logical layers:\n"
        "1) Presentation Layer: Role-tailored responsive web interfaces developed with modern reactive frameworks, providing customized operational cockpits "
        "for landowners, felling contractors, timber buyers, and system administrators.\n"
        "2) Application & Workflow Layer: Fast, asynchronous microservices (built on FastAPI) handling JSON Web Token (JWT) role-based access control, transition "
        "validation for harvest state lifecycles, inspection notifications, and counter-offer negotiations.\n"
        "3) Computational & Valuation Layer: Core domain algorithms computing wood volume metrics, district-level timber price indexing, contractor fleet optimization, "
        "and escrow settlement rules.\n"
        "4) Data Layer: Schema-flexible document storage (MongoDB) optimized for hierarchical tree inventories, nested contractor assessments, geospatial parcel "
        "indexing (2dsphere), and immutable payment audit logs."
    )

    # ASCII Architecture Diagram (Fig. 1) in Callout
    p_diag_box = doc.add_paragraph()
    p_diag_box.paragraph_format.left_indent = Inches(0.4)
    p_diag_box.paragraph_format.right_indent = Inches(0.4)
    p_diag_box.paragraph_format.space_before = Pt(6)
    p_diag_box.paragraph_format.space_after = Pt(2)
    r_diag = p_diag_box.add_run(
        "TreeConnect Integrated Architecture\n"
        "===========================================================\n"
        "                   PRESENTATION LAYER                      \n"
        "  Landowner Portal | Contractor Workspace | Buyer Marketplace \n"
        "-----------------------------------------------------------\n"
        "                            |                              \n"
        "                            v                              \n"
        "               APPLICATION & WORKFLOW LAYER                \n"
        "     Auth & RBAC (JWT)  |  Harvest State FSM Engine         \n"
        "     Inspection Router  |  Digital Agreement Generator     \n"
        "-----------------------------------------------------------\n"
        "                            |                              \n"
        "                            v                              \n"
        "              COMPUTATIONAL & VALUATION LAYER              \n"
        "    Allometric Volume Calc  |  Market Rate Indexer (Govt)  \n"
        "    Proposal Quoting Engine |  Escrow & Payment Webhook    \n"
        "-----------------------------------------------------------\n"
        "                            |                              \n"
        "                            v                              \n"
        "                        DATA LAYER                         \n"
        "  MongoDB Document Store | GeoJSON 2dsphere | Cloud Assets \n"
        "==========================================================="
    )
    r_diag.font.name = 'Consolas'
    r_diag.font.size = Pt(8.5)
    r_diag.font.color.rgb = RGBColor(30, 41, 59)

    p_f1 = doc.add_paragraph()
    p_f1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_f1.paragraph_format.space_after = Pt(10)
    r_f1 = p_f1.add_run("Fig. 1. Conceptual architecture of the proposed TreeConnect framework.")
    r_f1.font.size = Pt(9)
    r_f1.italic = True

    # VII. HARVEST LIFECYCLE
    add_sec_heading("VII. HARVEST LIFECYCLE AND OPERATIONAL PROCESS")
    add_body(
        "To ensure consistency and eliminate operational deadlocks, harvest requests advance through a deterministic state machine:\n"
        "S = {PENDING, CONTRACTOR_ASSIGNED, ASSESSMENT_SUBMITTED, REVISION_REQUESTED, OPERATION_READY, IN_PROGRESS, COMPLETED, CANCELLED}\n"
        "The interaction protocol is formalized in Algorithm 1."
    )

    # Algorithm 1 Box
    p_alg = doc.add_paragraph()
    p_alg.paragraph_format.left_indent = Inches(0.25)
    p_alg.paragraph_format.right_indent = Inches(0.25)
    p_alg.paragraph_format.space_before = Pt(4)
    p_alg.paragraph_format.space_after = Pt(8)
    p_alg_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:top w:val="single" w:sz="6" w:space="2" w:color="333333"/><w:bottom w:val="single" w:sz="6" w:space="2" w:color="333333"/></w:pBdr>')
    p_alg._p.get_or_add_pPr().append(p_alg_border)

    r_alg_head = p_alg.add_run("Algorithm 1: TreeConnect End-to-End Harvest & Settlement Cycle\n")
    r_alg_head.bold = True
    r_alg_head.font.size = Pt(9.5)
    r_alg_head.font.name = 'Consolas'

    r_alg_body = p_alg.add_run(
        " 1: Initialize Landowner Parcel P with Geo-tagged Tree Inventory {T_1, ..., T_m}\n"
        " 2: Landowner submits Harvest Request H_req specifying target trees {T_k}\n"
        " 3: Platform matches and assigns licensed Contractor C_j; status -> CONTRACTOR_ASSIGNED\n"
        " 4: Contractor schedules on-site inspection (Date, Time, Checklist, Assigned Inspector)\n"
        " 5: Contractor performs on-site appraisal and submits Assessment Submission A_j\n"
        " 6: IF Landowner requests modifications THEN\n"
        " 7:     Update status -> REVISION_REQUESTED; Contractor submits revised quote A'_j\n"
        " 8: END IF\n"
        " 9: Landowner accepts proposal A_j; status -> OPERATION_READY\n"
        "10: Generate Digital Agreement & Mobilization Advance Invoice\n"
        "11: Landowner clears Advance Escrow Deposit via Payment Gateway\n"
        "12: Contractor initiates field operations; status -> IN_PROGRESS\n"
        "13: Contractor completes felling, yarding, and log measurement; submits Completion Certificate\n"
        "14: Final Volume and Extraction validated by Landowner/Admin; status -> COMPLETED\n"
        "15: Release final escrow balance to Contractor; onboard harvested timber lots into Marketplace"
    )
    r_alg_body.font.name = 'Consolas'
    r_alg_body.font.size = Pt(8.5)

    # VIII. TREE INVENTORY & VOLUMETRIC VALUATION MODEL
    add_sec_heading("VIII. TREE INVENTORY & VOLUMETRIC VALUATION MODEL")
    add_body(
        "The TreeConnect computational engine calculates wood volume and gross valuation using standardized forestry formulations. "
        "For an individual tree T_i with girth at breast height G_i (in meters) and commercial bole height H_i (in meters), the merchantable "
        "round log volume V_i (m^3) is calculated using the quarter-girth (Hoppus) formula adjusted for metric forestry standards:"
    )
    add_equation("V_i = ( G_i / 4 )^2 * H_i * f_s", "4")
    add_body(
        "where f_s in [0.85, 1.10] represents the empirical species-specific form factor that adjusts for natural stem taper.\n"
        "The platform evaluates the suitability score S(c, p) for matching a candidate contractor c to a parcel p as:"
    )
    add_equation("S(c, p) = w_1 * [1 - (d(c, p) / d_max)] + w_2 * E(c, V_total) + w_3 * Phi(c)", "5")
    add_body(
        "where d(c, p) is the geographical geodesic distance between contractor depot and parcel, E(c, V_total) is the contractor's fleet and crew "
        "capacity match for the total requested harvest volume V_total = SUM(V_i), Phi(c) in [0, 1] represents the contractor's historical performance, "
        "safety rating, and completion rate, and w_1, w_2, w_3 represent configurable weights satisfying SUM(w_k) = 1.0."
    )

    # IX. CONTRACTOR INSPECTION & PRICING
    add_sec_heading("IX. CONTRACTOR INSPECTION, ASSESSMENT & PRICING MODEL")
    add_body(
        "Field assessment translates raw tree inventory into an actionable commercial proposal. When a contractor inspects a property, the platform "
        "captures three distinct commercial structures:\n"
        "1) Harvesting Service Quotation: The contractor charges an itemized service fee for felling, yard extraction, log cross-cutting, and haulage, "
        "while the landowner retains timber ownership.\n"
        "2) Direct Standing Timber Purchase Offer: The contractor bids a net purchase amount for the standing wood and absorbs all felling, extraction, "
        "and transport costs.\n"
        "3) Hybrid Purchase & Extraction Agreement: The contractor purchases specific high-value logs and clears residual biomass under an agreed cost-offset structure.\n"
        "The contractor's total quotation for a service contract is formulated as:"
    )
    add_equation("C_quote = C_felling + C_extraction + C_transport + C_permits + C_contingency", "6")
    add_body(
        "To protect both parties, the platform calculates a normalized site feasibility index F_p:"
    )
    add_equation("F_p = (1 / n) * SUM_{j=1}^n psi_j(x_j)", "7")
    add_body(
        "where psi_j(x_j) in [0, 1] normalizes checklist metrics such as slope gradient, ground soil stability, dwelling proximity, power grid clearance, "
        "and heavy machinery accessibility."
    )

    # X. MARKETPLACE & ESCROW
    add_sec_heading("X. MARKETPLACE, ESCROW PAYMENTS & TRACEABILITY")
    add_body(
        "TreeConnect addresses payment insecurity through a milestone-governed digital escrow pipeline. Upon commercial agreement ratification, total "
        "financial liability M_total is partitioned into verifiable milestones:"
    )
    add_equation("M_total = M_mobilization + M_felling + M_extraction + M_final", "8")
    add_body(
        "1) Mobilization Deposit (M_mobilization): Landowner deposits 15% to 25% advance to cover machinery transport and labor mobilization.\n"
        "2) Intermediate Milestone (M_felling): Released upon verification of directional felling completion.\n"
        "3) Terminal Settlement (M_final): Released following site clearance, log tally signing, and property restoration verification.\n"
        "Harvested logs are automatically converted into marketplace trade listings L = {Batch_ID, Species, V_actual, Log_Dimensions, Grade, Depot, Felling_Cert}. "
        "Mill buyers bid on verified physical inventory with guaranteed chain of custody, eliminating fraudulent timber claims and reducing procurement overhead."
    )

    # XI. PLATFORM ANALYTICS
    add_sec_heading("XI. PLATFORM ANALYTICS AND GOVERNANCE")
    add_body(
        "The TreeConnect administrative subsystem continuously monitors supply chain health, operational compliance, and spatial trends:\n"
        "• Regional Volume Yields: Aggregates timber yields by species and administrative district.\n"
        "• Price Volatility Indexing: Tracks contractor quotation variance against government reference rates to flag irregular bidding.\n"
        "• Contractor Fleet Efficiency: Evaluates idle machinery capacity, active job turnaround times, and felling output per work-crew day.\n"
        "• Carbon and Sustainability Accounting: Computes estimated biomass extraction and carbon offset potential, supporting future integration with voluntary carbon markets."
    )

    # XII. RESEARCH METHODOLOGY
    add_sec_heading("XII. RESEARCH METHODOLOGY")
    add_body(
        "This study adopts an applied design-and-evaluation methodology structured across four phases:\n"
        "Phase 1: Domain Analysis & Field Survey (analyzing operational friction across smallholders, contractors, and sawmills).\n"
        "Phase 2: Architectural Modeling & Protocol Formulation (defining data schemas, state-transition rules, and valuation functions).\n"
        "Phase 3: Software Implementation (building the full-stack system with FastAPI, React, MongoDB, and payment gateway webhooks).\n"
        "Phase 4: Controlled Simulation & Empirical Field Evaluation (benchmarking operational efficiency against traditional transactions).\n"
        "The research objectives are to: (1) develop an integrated multi-sided architecture for agroforestry timber operations; (2) represent tree dendrometric "
        "attributes to compute automated volume and pricing; (3) coordinate inspection scheduling, bilateral negotiation, and harvest completion via an FSM; "
        "(4) mitigate financial risk through milestone-driven escrow payments; and (5) establish quantitative evaluation criteria for system performance."
    )

    # XIII. RESEARCH QUESTIONS
    add_sec_heading("XIII. RESEARCH QUESTIONS")
    add_body(
        "The research is guided by four fundamental research questions:\n"
        "RQ1: How can decentralized tree inventory and geospatial data be structured to provide reliable volume and valuation estimates for private landowners?\n"
        "RQ2: To what extent does a finite-state machine workflow reduce operational delays and dispute rates in agroforestry harvest contracts compared to informal channels?\n"
        "RQ3: How effectively does a milestone-based digital escrow framework mitigate counterparty payment risk for contractors and property owners?\n"
        "RQ4: What measurable differences in pricing transparency, transaction cycle times, and operational efficiency emerge between TreeConnect and traditional timber trading?"
    )

    # XIV. EVALUATION FRAMEWORK
    add_sec_heading("XIV. EVALUATION FRAMEWORK")
    add_body(
        "The proposed evaluation framework separates technical performance from socio-economic outcomes, defining measurable criteria across both dimensions."
    )

    # TABLE II
    p_t2 = doc.add_paragraph()
    p_t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_t2.paragraph_format.space_before = Pt(8)
    p_t2.paragraph_format.space_after = Pt(4)
    r_t2 = p_t2.add_run("TABLE II\nPROPOSED EVALUATION MEASURES")
    r_t2.bold = True
    r_t2.font.size = Pt(9.5)

    table2 = doc.add_table(rows=6, cols=3)
    table2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table2)

    t2_headers = ["Measure", "Metric / Method", "Evaluation Purpose"]
    for i, h in enumerate(t2_headers):
        cell = table2.cell(0, i)
        cell.text = h
        set_cell_background(cell, "F1F5F9")
        set_cell_margins(cell, top=120, bottom=120, left=120, right=120)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.size = Pt(9)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT

    t2_data = [
        ("Volumetric Accuracy", "Mean Absolute Percentage Error (MAPE) vs. Scaled Log Yard Measurements", "Assesses whether pre-harvest dendrometric formulas predict actual cut volume accurately."),
        ("Quotation Variance", "Normalized Deviation from Government Reference Rates (sigma_quote)", "Measures pricing consistency and prevents predatory under- or over-quoting."),
        ("Lifecycle Turnaround", "Elapsed Time from Request to Completion (T_cycle in days)", "Measures reduction in administrative and negotiation delays."),
        ("Dispute Frequency", "Percentage of Jobs Requiring Admin Mediation (R_dispute)", "Evaluates whether structured inspection checklists and escrow rules minimize operational friction."),
        ("Economic Surplus", "Percentage Increase in Landowner Net Realization (Delta E_owner)", "Quantifies economic empowerment through intermediary disintermediation.")
    ]

    for row_idx, (m, met, purp) in enumerate(t2_data, start=1):
        c0 = table2.cell(row_idx, 0)
        c1 = table2.cell(row_idx, 1)
        c2 = table2.cell(row_idx, 2)
        c0.text = m
        c1.text = met
        c2.text = purp
        set_cell_margins(c0, top=100, bottom=100, left=120, right=120)
        set_cell_margins(c1, top=100, bottom=100, left=120, right=120)
        set_cell_margins(c2, top=100, bottom=100, left=120, right=120)
        c0.paragraphs[0].runs[0].font.bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(9)
        c1.paragraphs[0].runs[0].font.size = Pt(9)
        c2.paragraphs[0].runs[0].font.size = Pt(9)
        if row_idx % 2 == 1:
            set_cell_background(c0, "FAFAFA")
            set_cell_background(c1, "FAFAFA")
            set_cell_background(c2, "FAFAFA")

    add_subsec_heading("A. Comparative Efficiency Formulation")
    add_body(
        "Operational improvement is quantified by benchmarking TreeConnect against conventional informal transactions:"
    )
    add_equation("Delta E = [ (T_traditional - T_TreeConnect) / T_traditional ] * 100%", "9")
    add_body(
        "where T represents the average duration from harvest initiation to commercial financial settlement. Similarly, the landowner economic "
        "gain Delta R is expressed as:"
    )
    add_equation("Delta R = Mean(R_TreeConnect) - Mean(R_traditional)", "10")
    add_body(
        "The statistical significance of observed differences will be verified using paired two-sample t-tests and non-parametric Wilcoxon "
        "signed-rank tests across multi-district empirical deployments."
    )

    # XV. EXPECTED CONTRIBUTION
    add_sec_heading("XV. EXPECTED CONTRIBUTION")
    add_body(
        "The primary contribution of this work is architectural, operational, and algorithmic rather than the assertion of a predetermined commercial effect. "
        "TreeConnect provides a unified framework in which landowner inventory data, contractor inspection appraisals, pricing indices, and milestone "
        "settlements participate in a synchronized operational pipeline.\n"
        "This integration allows empirical investigation of relationships that cannot be adequately studied when components are deployed independently. "
        "Contractor performance can be evaluated not only on task completion speed, but also on quotation fidelity, inspection accuracy, and safety adherence."
    )

    # XVI. DISCUSSION
    add_sec_heading("XVI. DISCUSSION")
    add_body(
        "The proposed framework addresses the core integration challenges identified in decentralized agroforestry supply chains. By establishing transparent "
        "reference rate indexing and standardized volume calculation, TreeConnect reduces information asymmetry that has historically favored intermediary "
        "brokers over primary producers.\n"
        "Concurrently, the platform provides contractors with operational predictability. Milestone-based escrow security ensures contractors can mobilize "
        "expensive capital machinery and specialized felling crews without fear of landowner default or renegotiation upon site arrival. For industrial wood "
        "processors, the platform provides verifiable chain-of-custody documentation, supporting legal compliance and sustainable forestry standards."
    )

    # XVII. LIMITATIONS
    add_sec_heading("XVII. LIMITATIONS")
    add_body(
        "Several real-world limitations must be considered:\n"
        "1) Dendrometric Measurement Variation: Pre-harvest volume calculations rely on tree measurements recorded by non-expert landowners, which may introduce "
        "discrepancies until validated during contractor on-site inspection.\n"
        "2) Rural Connectivity Constraints: Dispersed farm parcels frequently experience intermittent cellular network access, requiring offline caching "
        "mechanisms for mobile inspection checklists.\n"
        "3) Undetected Biological Defects: Internal stem defects, heart rot, and insect damage cannot be fully evaluated non-destructively prior to felling, "
        "necessitating contingency provisions in commercial quotations.\n"
        "4) Regulatory Divergence: Forest transit and tree preservation regulations vary significantly across administrative boundaries, requiring localized statutory adaptation."
    )

    # XVIII. FUTURE WORK
    add_sec_heading("XVIII. FUTURE WORK")
    add_body(
        "Future work will focus on: (1) integrating computer vision models on mobile devices to automatically estimate tree diameter and height from photographs; "
        "(2) formulating operations-research dispatch algorithms to optimize multi-parcel contractor felling routes; (3) investigating blockchain-backed digital "
        "tokens for timber traceability from farm stump to final consumer product; and (4) incorporating satellite remote sensing for continuous farm canopy "
        "monitoring and carbon credit certification."
    )

    # XIX. CONCLUSION
    add_sec_heading("XIX. CONCLUSION")
    add_body(
        "This paper presented TreeConnect, an integrated digital ecosystem for agroforestry management, dynamic timber valuation, and transparent multi-stakeholder "
        "harvest operations. The central architectural principle is unifying fragmented timber trading activities—from tree mapping and on-site inspection to "
        "milestone escrow clearing and marketplace order fulfillment—into a continuous, auditable lifecycle.\n"
        "By replacing opaque intermediaries with algorithmic valuation and deterministic operational state machines, TreeConnect establishes a solid foundation "
        "for equitable, efficient, and traceable timber supply chains. The next stage of this research involves multi-district empirical pilot deployments to "
        "evaluate volumetric accuracy, quotation fairness, cycle time reductions, and socio-economic outcomes across participating rural communities."
    )

    # ACKNOWLEDGMENT
    add_sec_heading("ACKNOWLEDGMENT")
    add_body(
        "The author acknowledges the academic guidance, forestry domain experts, and institutional support provided by the Department of Computer Applications, "
        "Amal Jyothi College of Engineering, during the conceptualization, system architecture design, and development of the TreeConnect platform."
    )

    # REFERENCES
    add_sec_heading("REFERENCES")
    refs = [
        "[1] P. K. R. Nair, An Introduction to Agroforestry. Dordrecht: Kluwer Academic Publishers, 1993.",
        "[2] D. L. Grebner, L. S. Perez-Verdin, C. Sun, I. A. Munn, E. B. Schultz, and T. G. Matney, \"Woody biomass availability for bioenergy production in Mississippi,\" Journal of Forestry, vol. 107, no. 3, pp. 139–147, 2009.",
        "[3] J. Bettinger, K. Boston, J. P. Siry, and D. L. Grebner, Forest Management and Planning, 2nd ed. San Diego, CA: Academic Press, 2017.",
        "[4] M. A. Choudhry and M. P. O'Kelly, \"Logistics planning for timber harvesting in fragmented private woodlots,\" International Journal of Forest Engineering, vol. 28, no. 2, pp. 88–97, 2017.",
        "[5] D. F. Dennis, \"An analysis of risks and transaction costs in private timber sales agreements,\" Forest Science, vol. 35, no. 4, pp. 1088–1098, 1989.",
        "[6] E. Hansen, R. Panwar, and R. Vlosky, The Global Forest Sector: Changes, Practices, and Prospects. Boca Raton, FL: CRC Press, 2014.",
        "[7] U. Deichmann, A. Goyal, and D. Mishra, \"Will digital technologies transform agriculture in developing countries?\" World Bank Research Observer, vol. 31, no. 2, pp. 265–293, 2016.",
        "[8] T. Fabregas, M. Kremer, and F. Schilbach, \"Realizing the potential of digital development: The case of agricultural advisory services,\" Science, vol. 366, no. 6471, p. eaay3038, 2019.",
        "[9] M. A. Wulder, C. W. Bater, N. C. Coops, T. Hilker, and J. C. White, \"The role of LiDAR in sustainable forest management,\" The Forestry Chronicle, vol. 84, no. 6, pp. 807–826, 2008.",
        "[10] F. Holzinger, K. Stampfer, and C. Kanzian, \"A decision support system for timber harvesting and transport operations in steep terrain,\" Computers and Electronics in Agriculture, vol. 162, pp. 936–947, 2019.",
        "[11] D. P. Dykstra and R. Heinrich, \"FAO Model Code of Forest Harvesting Practice,\" Food and Agriculture Organization of the United Nations (FAO), Rome, Forestry Paper 133, 1996.",
        "[12] Kerala Forest Department, \"The Kerala Promotion of Tree Growth in Non-Forest Areas Act, 2005,\" Government of Kerala, Gazette Notification, Thiruvananthapuram, India, 2005.",
        "[13] N. Kshetri, \"Blockchain’s roles in meeting key supply chain objectives,\" International Journal of Information Management, vol. 39, pp. 80–89, 2018."
    ]

    for ref in refs:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.left_indent = Inches(0.3)
        p_ref.paragraph_format.first_line_indent = Inches(-0.3)
        p_ref.paragraph_format.space_after = Pt(3)
        r = p_ref.add_run(ref)
        r.font.size = Pt(8.5)
        r.font.name = 'Times New Roman'

    output_path = r"d:\Projects\TreeConnect\TreeConnect_Research_Paper.docx"
    doc.save(output_path)
    print(f"Successfully generated research paper at: {output_path}")

if __name__ == "__main__":
    build_paper()
