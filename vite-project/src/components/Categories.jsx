import { categories } from "../data/Categories.js";

export default function Categories({ onSelectCategory }) {
  return (
    <section className="section categories-section" id="categories">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">WHAT NEEDS ATTENTION?</span>
          <h2>Small problems deserve real solutions.</h2>
          <p>Choose the category that best describes your issue.</p>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <a
              key={category.title}
              href="#report"
              className="category-card"
              onClick={() => onSelectCategory(category.title)}
            >
              <span className="category-icon" aria-hidden="true">
                {category.icon}
              </span>

              <h3>{category.title}</h3>
              <p>{category.description}</p>

              <span className="category-link">Report issue →</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}