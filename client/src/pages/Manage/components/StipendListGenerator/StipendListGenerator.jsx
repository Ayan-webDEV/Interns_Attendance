import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  LoaderCircle,
  Search,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import { api, saveBlob } from "../../../../api/client";
import styles from "./StipendListGenerator.module.css";

const TEMPLATE_OPTIONS = [
  {
    value: "2",
    label: "2 Interns",
    description: "For a stipend list containing 2 interns",
  },
  {
    value: "3",
    label: "3 Interns",
    description: "For a stipend list containing 3 interns",
  },
];

const DOMAINS = [
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "UI/UX Design",
  "Graphic Design",
  "App Development",
  "Data Analytics",
  "Digital Marketing",
  "Content Writing",
];

const EMPTY_INTERN = {
  name: "",
  internId: "",
  email: "",
  domain: "",
};

function getInternKey(intern) {
  return String(
    intern?._id || intern?.id || intern?.internId || intern?.email || "",
  );
}

function normalizeGroupIntern(intern) {
  return {
    name: intern?.name || "",
    internId: intern?.internId || intern?.internID || "",
    email: intern?.email || "",
    domain: intern?.domain || "",
  };
}

function validateIntern(intern, index) {
  const number = index + 1;

  if (!intern.name.trim()) {
    return `Enter the full name of Intern ${number}.`;
  }

  if (!intern.internId.trim()) {
    return `Enter the intern ID of Intern ${number}.`;
  }

  if (!intern.domain.trim()) {
    return `Select the internship domain for Intern ${number}.`;
  }

  if (
    intern.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intern.email.trim())
  ) {
    return `Enter a valid email address for Intern ${number}.`;
  }

  return "";
}

export default function StipendListGenerator({ group, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState("");
  const [method, setMethod] = useState("");
  const [groupName, setGroupName] = useState(group?.name || "");

  const [groupInterns, setGroupInterns] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [manualInterns, setManualInterns] = useState([]);
  const [internSearch, setInternSearch] = useState("");

  const [loadingInterns, setLoadingInterns] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const requiredCount = Number(template);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    setGroupName(group?.name || "");
  }, [group]);

  useEffect(() => {
    if (!template) return;

    setManualInterns(
      Array.from({ length: Number(template) }, () => ({ ...EMPTY_INTERN })),
    );
    setSelectedKeys([]);
    setError("");
  }, [template]);

  const selectedInterns = useMemo(() => {
    const internMap = new Map(
      groupInterns.map((intern) => [getInternKey(intern), intern]),
    );

    return selectedKeys
      .map((key) => internMap.get(key))
      .filter(Boolean)
      .map(normalizeGroupIntern);
  }, [groupInterns, selectedKeys]);

  const filteredInterns = useMemo(() => {
    const query = internSearch.trim().toLowerCase();

    if (!query) return groupInterns;

    return groupInterns.filter((intern) =>
      [intern.name, intern.email, intern.internId, intern.domain].some(
        (value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
      ),
    );
  }, [groupInterns, internSearch]);

  const loadGroupInterns = async () => {
    if (!group?._id) {
      setError("The selected group could not be identified.");
      return;
    }

    setLoadingInterns(true);
    setError("");

    try {
      const response = await api(`/groups/${group._id}/interns`);

      const interns = Array.isArray(response)
        ? response
        : response?.interns || [];

      //   setGroupInterns(interns);
      setGroupInterns(
        interns.filter(
          (intern) => intern.offerSentStatus === "manual_admin_addition",
        ),
      );
    } catch (err) {
      setError(err.message || "Could not load group interns.");
    } finally {
      setLoadingInterns(false);
    }
  };

  const chooseMethod = async (selectedMethod) => {
    setMethod(selectedMethod);
    setError("");
    setStep(3);

    if (selectedMethod === "select" && groupInterns.length === 0) {
      await loadGroupInterns();
    }
  };

  const toggleIntern = (intern) => {
    const key = getInternKey(intern);

    if (!key) return;

    setError("");

    setSelectedKeys((previous) => {
      if (previous.includes(key)) {
        return previous.filter((item) => item !== key);
      }

      if (previous.length >= requiredCount) {
        setError(
          `You can select only ${requiredCount} interns for this template.`,
        );
        return previous;
      }

      return [...previous, key];
    });
  };

  const updateManualIntern = (index, field, value) => {
    setManualInterns((previous) =>
      previous.map((intern, currentIndex) =>
        currentIndex === index ? { ...intern, [field]: value } : intern,
      ),
    );
  };

  const goBack = () => {
    setError("");

    if (step === 3) {
      setStep(2);
      setMethod("");
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  };

  const generatePdf = async (event) => {
    event.preventDefault();
    setError("");

    if (!groupName.trim()) {
      setError("Enter the group / batch name.");
      return;
    }

    let interns = [];

    if (method === "select") {
      if (selectedInterns.length !== requiredCount) {
        setError(`Please select exactly ${requiredCount} interns.`);
        return;
      }

      interns = selectedInterns;
    } else if (method === "manual") {
      interns = manualInterns;

      for (let index = 0; index < interns.length; index += 1) {
        const validationError = validateIntern(interns[index], index);

        if (validationError) {
          setError(validationError);
          return;
        }
      }
    } else {
      setError("Please choose an intern selection method.");
      return;
    }

    setGenerating(true);

    try {
      const body =
        method === "select"
          ? {
              source: "group",
              template,
              groupName: groupName.trim(),
              internIds: interns.map((intern) => intern.internId),
            }
          : {
              source: "manual",
              template,
              groupName: groupName.trim(),
              interns,
            };

      const blob = await api(`/groups/${group._id}/stipend/generate`, {
        method: "POST",
        body,
      });

      if (!(blob instanceof Blob)) {
        throw new Error("The server did not return a valid PDF file.");
      }

      const safeGroupName = groupName
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

      saveBlob(
        blob,
        `Stipend-List-${safeGroupName || "VELoop"}-${template}-Interns.pdf`,
      );

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "PDF generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !generating) {
          onClose?.();
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stipend-title"
      >
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <Wallet size={21} />
          </div>

          <div className={styles.headerText}>
            <h2 id="stipend-title">Generate Stipend List</h2>
            <p>
              Create the stipend approval list for{" "}
              <strong>{group?.name || "this group"}</strong>
            </p>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={generating}
            aria-label="Close stipend generator"
          >
            <X size={19} />
          </button>
        </header>

        <div className={styles.progress}>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`${styles.progressStep} ${
                step >= item ? styles.progressActive : ""
              }`}
            >
              <span>{step > item ? <Check size={13} /> : item}</span>
              <small>
                {item === 1 ? "Template" : item === 2 ? "Method" : "Interns"}
              </small>
            </div>
          ))}
        </div>

        <div className={styles.body}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.sectionHeading}>
                <h3>Select stipend PDF template</h3>
                <p>
                  Choose the template according to the number of interns
                  included in the stipend list.
                </p>
              </div>

              <div className={styles.templateGrid}>
                {TEMPLATE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className={`${styles.templateOption} ${
                      template === option.value ? styles.optionSelected : ""
                    }`}
                    onClick={() => setTemplate(option.value)}
                  >
                    <span className={styles.templateIcon}>
                      <Users size={21} />
                    </span>

                    <strong>{option.label}</strong>
                    <small>{option.description}</small>

                    {template === option.value && (
                      <span className={styles.selectedMark}>
                        <Check size={13} />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <label className={styles.label}>
                Group / batch name
                <input
                  type="text"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Enter group or batch name"
                  maxLength={90}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.sectionHeading}>
                <h3>Choose intern entry method</h3>
                <p>
                  Select registered interns from this group or enter their
                  details manually.
                </p>
              </div>

              <div className={styles.methodGrid}>
                <button
                  type="button"
                  className={styles.methodOption}
                  onClick={() => chooseMethod("select")}
                >
                  <span className={styles.methodIcon}>
                    <Users size={23} />
                  </span>

                  <strong>Select Interns</strong>
                  <small>
                    Choose {requiredCount} interns from this group's registered
                    intern list.
                  </small>

                  <span className={styles.methodAction}>
                    Choose from group <ArrowRight size={15} />
                  </span>
                </button>

                <button
                  type="button"
                  className={styles.methodOption}
                  onClick={() => chooseMethod("manual")}
                >
                  <span className={styles.methodIcon}>
                    <FileText size={23} />
                  </span>

                  <strong>Manual Entry</strong>
                  <small>
                    Enter the name, intern ID, and domain for each intern.
                  </small>

                  <span className={styles.methodAction}>
                    Enter details <ArrowRight size={15} />
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form
              id="stipend-generate-form"
              className={styles.stepContent}
              onSubmit={generatePdf}
            >
              {method === "select" && (
                <>
                  <div
                    className={`${styles.sectionHeading} flex justify-between`}
                  >
                    <div>
                      <h3>Select registered interns</h3>
                      <p>
                        Select exactly {requiredCount} interns. Their selection
                        order will be used in the PDF.
                      </p>
                    </div>

                    <div className={styles.selectionSummary}>
                      <span className="me-1.5">Selected interns: </span>
                      <strong>
                        {selectedKeys.length} / {requiredCount}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.searchBox}>
                    <Search size={16} />
                    <input
                      type="search"
                      placeholder="Search by name, email, ID or domain"
                      value={internSearch}
                      onChange={(event) => setInternSearch(event.target.value)}
                    />
                  </div>

                  {loadingInterns ? (
                    <div className={styles.loadingState}>
                      <LoaderCircle className={styles.spinner} size={22} />
                      <span>Loading group interns...</span>
                    </div>
                  ) : groupInterns.length === 0 ? (
                    <div className={styles.emptyState}>
                      <Users size={25} />
                      <strong>No manually added interns found</strong>
                      <span>
                        This group has no interns marked with the Added tag.
                      </span>
                    </div>
                  ) : (
                    <div className={styles.internList}>
                      {filteredInterns.map((intern) => {
                        const key = getInternKey(intern);
                        const selectedIndex = selectedKeys.indexOf(key);
                        const isSelected = selectedIndex !== -1;
                        const isDisabled =
                          !isSelected && selectedKeys.length >= requiredCount;

                        return (
                          <button
                            type="button"
                            key={key}
                            className={`${styles.internOption} ${
                              isSelected ? styles.internSelected : ""
                            }`}
                            onClick={() => toggleIntern(intern)}
                            disabled={isDisabled}
                          >
                            <span className={styles.checkbox}>
                              {isSelected && <Check size={13} />}
                            </span>

                            <span className={styles.internInfo}>
                              <span className={styles.internNameHeading}>
                                <strong>
                                  {intern.name || "Unnamed intern"}
                                </strong>

                                {intern.offerSentStatus ===
                                  "manual_admin_addition" && (
                                  <span className={styles.addedTag}>Added</span>
                                )}
                              </span>

                              <small>
                                {intern.email || "No email"} ·{" "}
                                {intern.internId || "No intern ID"}
                              </small>

                              <small>
                                {intern.domain || "Domain not specified"}
                              </small>
                            </span>

                            {isSelected && (
                              <span className={styles.selectionNumber}>
                                {selectedIndex + 1}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {method === "manual" && (
                <>
                  <div className={styles.sectionHeading}>
                    <h3>Enter intern details</h3>
                    <p>
                      Complete the name, intern ID, and domain for each of the{" "}
                      {requiredCount} interns. Email is optional.
                    </p>
                  </div>

                  <div className={styles.manualList}>
                    {manualInterns.map((intern, index) => (
                      <article className={styles.manualCard} key={index}>
                        <div className={styles.manualCardHeading}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>Intern {index + 1}</strong>
                        </div>

                        <div className={styles.manualGrid}>
                          <label className={styles.label}>
                            Full name
                            <input
                              type="text"
                              value={intern.name}
                              onChange={(event) =>
                                updateManualIntern(
                                  index,
                                  "name",
                                  event.target.value,
                                )
                              }
                              placeholder="Intern full name"
                              maxLength={100}
                            />
                          </label>

                          <label className={styles.label}>
                            Intern ID
                            <input
                              type="text"
                              value={intern.internId}
                              onChange={(event) =>
                                updateManualIntern(
                                  index,
                                  "internId",
                                  event.target.value,
                                )
                              }
                              placeholder="VLRINT20260XXXX"
                              maxLength={50}
                            />
                          </label>

                          <label className={styles.label}>
                            Email address (optional)
                            <input
                              type="email"
                              value={intern.email}
                              onChange={(event) =>
                                updateManualIntern(
                                  index,
                                  "email",
                                  event.target.value,
                                )
                              }
                              placeholder="intern@example.com"
                              maxLength={160}
                            />
                          </label>

                          <label className={styles.label}>
                            Internship domain
                            <select
                              value={intern.domain}
                              onChange={(event) =>
                                updateManualIntern(
                                  index,
                                  "domain",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Select internship domain</option>

                              {DOMAINS.map((domain) => (
                                <option key={domain} value={domain}>
                                  {domain}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}

              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}
            </form>
          )}

          {step !== 3 && error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}
        </div>

        <footer className={`${styles.footer} md:pt-3 md:px-6`}>
          {step > 1 ? (
            <>
              <button
                type="button"
                className={styles.backButton}
                onClick={goBack}
                disabled={generating}
              >
                <ArrowLeft size={15} />
                Back
              </button>

              {step === 3 ? (
                <button
                  type="submit"
                  form="stipend-generate-form"
                  className={styles.generateButton}
                  disabled={
                    generating ||
                    loadingInterns ||
                    (method === "select" &&
                      selectedKeys.length !== requiredCount)
                  }
                >
                  {generating ? (
                    <LoaderCircle className={styles.spinner} size={17} />
                  ) : (
                    <Download size={17} />
                  )}

                  {generating ? "Generating PDF..." : "Generate & Download PDF"}
                </button>
              ) : (
                <span className={styles.footerHint}>
                  Choose an entry method to continue.
                </span>
              )}
            </>
          ) : (
            <>
              <span className={styles.footerHint}>Step 1 of 3</span>

              <button
                type="button"
                className={styles.nextButton}
                disabled={!template || !groupName.trim()}
                onClick={() => {
                  setError("");
                  setStep(2);
                }}
              >
                Continue <ArrowRight size={15} />
              </button>
            </>
          )}
        </footer>

        {step === 3 && (
          <div className={styles.footerHint}>
            {method === "select"
              ? `${selectedKeys.length} of ${requiredCount} selected`
              : `${requiredCount} intern forms`}
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
