import { useId } from "react";
import { Link } from "react-router-dom";

function FormLayout({ title, subtitle, icon, maxWidth = "sm", backTo, backLabel = "Back", children }) {
  const titleId = useId();
  const widthClass =
    maxWidth === "lg"
      ? "max-w-3xl"
      : maxWidth === "md"
        ? "max-w-2xl"
        : "max-w-md";

  return (
    <div
      className="form-page"
      role="region"
      {...(title ? { "aria-labelledby": titleId } : { "aria-label": "Form" })}
    >
      <div className={`form-card ${widthClass} animate-fade-in-up`}>
        {backTo && (
          <div className="form-back">
            <Link to={backTo} className="form-back-link">
              {backLabel}
            </Link>
          </div>
        )}
        {(icon || title) && (
          <div className="form-header">
            {icon && <div className="form-icon-badge">{icon}</div>}
            {title && (
              <h1 id={titleId} className="form-title">
                {title}
              </h1>
            )}
            {subtitle && <p className="form-subtitle">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default FormLayout;
